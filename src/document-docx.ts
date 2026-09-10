import type { StructuredDocument } from './document-model';
import { sanitizeDocxFilename } from './document-model';

export async function createDocxBlob(model: StructuredDocument): Promise<{ blob: Blob; filename: string }> {
  const { AlignmentType, BorderStyle, Document, Footer, HeadingLevel, LevelFormat, Packer, PageOrientation, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, VerticalAlign, WidthType } = await import('docx');
  const children: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [];
  children.push(new Paragraph({ text: model.title, heading: HeadingLevel.TITLE, spacing: { after: 180 } }));
  if (model.subtitle) children.push(new Paragraph({ children: [new TextRun({ text: model.subtitle, italics: true, color: '444444', size: 24 })], spacing: { after: 220 } }));
  if (model.date) children.push(new Paragraph({ children: [new TextRun({ text: model.date, color: '666666', size: 20 })], spacing: { after: 160 } }));
  model.metadata.forEach((item) => children.push(new Paragraph({ children: [new TextRun({ text: `${item.label}: `, bold: true }), new TextRun(item.value)], spacing: { after: 80 } })));
  for (const section of model.sections) {
    children.push(new Paragraph({ text: section.heading, heading: section.level === 1 ? HeadingLevel.HEADING_1 : section.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3, pageBreakBefore: false, keepNext: true }));
    for (const block of section.blocks) {
      if (block.type === 'paragraph') children.push(new Paragraph({ children: [new TextRun(block.text)], spacing: { after: 140, line: 300 } }));
      else if (block.type === 'heading') children.push(new Paragraph({ text: block.text, heading: block.level === 1 ? HeadingLevel.HEADING_1 : block.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3, keepNext: true }));
      else if (block.type === 'list') block.items.forEach((item) => children.push(new Paragraph(block.style === 'numbered' ? { text: item, numbering: { reference: 'enkh-numbering', level: 0 }, spacing: { after: 80 } } : { text: item, bullet: { level: 0 }, spacing: { after: 80 } })));
      else {
        const borders = { top: { style: BorderStyle.SINGLE, color: 'D9D9D9', size: 4 }, bottom: { style: BorderStyle.SINGLE, color: 'D9D9D9', size: 4 }, left: { style: BorderStyle.SINGLE, color: 'D9D9D9', size: 4 }, right: { style: BorderStyle.SINGLE, color: 'D9D9D9', size: 4 }, insideHorizontal: { style: BorderStyle.SINGLE, color: 'D9D9D9', size: 4 }, insideVertical: { style: BorderStyle.SINGLE, color: 'D9D9D9', size: 4 } };
        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders, rows: [
          new TableRow({ tableHeader: true, children: block.columns.map((column) => new TableCell({ shading: { fill: 'DCE6F1', type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: column, bold: true, color: '000000' })], alignment: AlignmentType.CENTER })] })) }),
          ...block.rows.map((row) => new TableRow({ children: block.columns.map((_, index) => new TableCell({ margins: { top: 100, bottom: 100, left: 120, right: 120 }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun(row[index] || '')] })] })) })),
        ] }));
        children.push(new Paragraph({ text: '', spacing: { after: 120 } }));
      }
    }
  }
  if (model.signature) {
    children.push(new Paragraph({ text: model.signature.label || 'Гарын үсэг', heading: HeadingLevel.HEADING_2, spacing: { before: 240 } }));
    [model.signature.name, model.signature.role, model.signature.date].filter(Boolean).forEach((value) => children.push(new Paragraph({ text: value })));
  }
  const document = new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 22, color: '000000' }, paragraph: { spacing: { after: 120, line: 300 } } }, title: { run: { font: 'Arial', size: 38, bold: true, color: '000000' } }, heading1: { run: { font: 'Arial', size: 30, bold: true, color: '000000' } }, heading2: { run: { font: 'Arial', size: 26, bold: true, color: '000000' } }, heading3: { run: { font: 'Arial', size: 23, bold: true, color: '000000' } } } },
    numbering: { config: [{ reference: 'enkh-numbering', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, footers: model.footer ? { default: new Footer({ children: [new Paragraph({ children: [new TextRun({ text: model.footer.text, color: '666666', size: 18 })], alignment: AlignmentType.CENTER })] }) } : undefined, children }],
  });
  return { blob: await Packer.toBlob(document), filename: sanitizeDocxFilename(model.title || model.documentType) };
}

export async function downloadDocx(model: StructuredDocument): Promise<string> {
  if (typeof document === 'undefined' || typeof URL === 'undefined') throw new Error('DOCX download is available on web only.');
  const { blob, filename } = await createDocxBlob(model); const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
  try { anchor.href = url; anchor.download = filename; anchor.rel = 'noopener'; document.body.appendChild(anchor); anchor.click(); } finally { anchor.remove(); URL.revokeObjectURL(url); }
  return filename;
}
