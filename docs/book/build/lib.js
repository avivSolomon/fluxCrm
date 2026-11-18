// Helpers for building Hebrew RTL .docx files with docx-js (post-process with hebrew_fix.py).
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, BorderStyle,
  WidthType, ShadingType, HeadingLevel, ImageRun, Footer, PageNumber, TableOfContents, PageBreak,
  VerticalAlign,
} = require('docx');

const FONT = 'David';
const SIZE = 24; // 12pt

const hr = (text, o = {}) =>
  new TextRun({ text, font: FONT, size: SIZE, rightToLeft: true, language: { value: 'he-IL', bidi: 'he-IL' }, ...o });
const en = (text, o = {}) => new TextRun({ text, font: o.font || 'Arial', size: o.size ? o.size - 2 : SIZE - 2, language: { value: 'en-US' }, ...o, ...(o.size ? { size: o.size - 2 } : {}) });

// Latin/technical tokens (identifiers, paths, URLs, numbers with units) are emitted as LTR runs.
const LATIN = /\$?[A-Za-z][A-Za-z0-9_.\/:$@#=+*?&%\\-]*(?: \$?[A-Za-z0-9][A-Za-z0-9_.\/:$@#=+*?&%\\-]*)*/g;
function runs(text, o = {}) {
  const out = [];
  let last = 0;
  for (const m of text.matchAll(LATIN)) {
    let tok = m[0];
    while (/[.,:;\-]$/.test(tok)) tok = tok.slice(0, -1);
    if (!tok) continue;
    if (m.index > last) out.push(hr(text.slice(last, m.index), o));
    out.push(en(tok, o));
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(hr(text.slice(last), o));
  return out;
}
// **bold** markup inside a paragraph string
function rich(text, o = {}) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.flatMap((p) => (p.startsWith('**') ? runs(p.slice(2, -2), { ...o, bold: true }) : runs(p, o)));
}

const SP = { line: 360, after: 120 };
const P = (text, o = {}) =>
  new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, spacing: SP, children: rich(text, o.run), ...o.para });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, bidirectional: true, alignment: AlignmentType.RIGHT, pageBreakBefore: false, children: [hr(t, { bold: true, size: 34, color: '1F3864' })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, bidirectional: true, alignment: AlignmentType.RIGHT, children: [hr(t, { bold: true, size: 28, color: '2E75B6' })] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, bidirectional: true, alignment: AlignmentType.RIGHT, children: [hr(t, { bold: true, size: 25, color: '1F3864' })] });
const B = (text, lvl = 0) =>
  new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { line: 340, after: 60 }, indent: { left: 360 + lvl * 360, hanging: 360 }, children: [hr('•   '), ...rich(text)] });
const N = (n, text) =>
  new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { line: 340, after: 60 }, indent: { left: 400, hanging: 400 }, children: [hr(`${n}.   `), ...rich(text)] });
const BR = () => new Paragraph({ children: [new PageBreak()] });

// code block: LTR, monospace, shaded, one paragraph per line
function CODE(src) {
  return src.replace(/\n$/, '').split('\n').map((line, i, a) =>
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 240, after: 0 },
      shading: { type: ShadingType.CLEAR, fill: 'F3F4F6' },
      border: {
        left: { style: BorderStyle.SINGLE, size: 12, color: '2E75B6', space: 4 },
        ...(i === 0 ? { top: { style: BorderStyle.SINGLE, size: 2, color: 'E5E7EB', space: 2 } } : {}),
        ...(i === a.length - 1 ? { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'E5E7EB', space: 2 } } : {}),
      },
      children: [new TextRun({ text: line.length ? line : ' ', font: 'Consolas', size: 18 })],
    }));
}

const bd = { style: BorderStyle.SINGLE, size: 4, color: 'BFC5CC' };
const borders = { top: bd, bottom: bd, left: bd, right: bd };
// rows: array of arrays of strings; first row = header. widths in DXA (sum ~ 9000). First column = rightmost (RTL).
function TABLE(rows, widths, { size = 20, headFill = '1F3864' } = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((r, ri) =>
      new TableRow({
        tableHeader: ri === 0,
        cantSplit: true,
        children: r.map((cell, ci) =>
          new TableCell({
            borders, verticalAlign: VerticalAlign.TOP,
            width: { size: widths[ci], type: WidthType.DXA },
            shading: ri === 0 ? { fill: headFill, type: ShadingType.CLEAR } : (ri % 2 === 0 ? { fill: 'F5F8FC', type: ShadingType.CLEAR } : undefined),
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: String(cell).split('\n').map((line) =>
              new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { line: 276, after: 20 },
                children: rich(line, ri === 0 ? { bold: true, color: 'FFFFFF', size } : { size }) })),
          })),
      })),
  });
}

// image from file; width in cm (aspect from PNG header)
function IMG(file, widthCm, caption) {
  const buf = fs.readFileSync(file);
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  const px = Math.round(widthCm * 37.8);
  const out = [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, keepNext: true,
    children: [new ImageRun({ type: 'png', data: buf, transformation: { width: px, height: Math.round((px * h) / w) } })] })];
  if (caption) out.push(new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: rich(caption, { size: 20, italics: true, color: '475569' }) }));
  return out;
}

const SPACER = (n = 1) => Array.from({ length: n }, () => new Paragraph({ children: [] }));

const styles = {
  default: { document: { run: { font: FONT, size: SIZE, language: { bidi: 'he-IL' } } } },
  paragraphStyles: [
    { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { size: 34, bold: true, font: FONT, color: '1F3864' }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0, keepNext: true } },
    { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { size: 28, bold: true, font: FONT, color: '2E75B6' }, paragraph: { spacing: { before: 260, after: 120 }, outlineLevel: 1, keepNext: true } },
    { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { size: 25, bold: true, font: FONT, color: '1F3864' }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2, keepNext: true } },
  ],
};

const footer = (label) =>
  new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
    new TextRun({ text: label + ' — עמוד ', font: FONT, size: 18, rtl: true, color: '6B7280' }),
    new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: '6B7280' }) ] })] });

function build(children, outFile, label) {
  const doc = new Document({
    creator: 'FluxCRM', title: label, styles,
    features: { updateFields: true },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1418, bottom: 1134, left: 1418 } } },
      footers: { default: footer(label) },
      children,
    }],
  });
  return Packer.toBuffer(doc).then((b) => fs.writeFileSync(outFile, b));
}

module.exports = { hr, en, runs, rich, P, H1, H2, H3, B, N, BR, CODE, TABLE, IMG, SPACER, build, TableOfContents, Paragraph, AlignmentType, TextRun };
