import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { UserQuery } from '../types/damu';

export interface CoreProgramExport {
  id: string;
  title: string;
  category: string;
  limit: string;
  rate: string;
  term: string;
  purposes: string;
  financier: string;
  sourceId: string;
  url: string;
  note: string;
  applicable: boolean;
}

export async function generateDocxReport(
  query: UserQuery,
  okedName: string,
  corePrograms: CoreProgramExport[]
): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Заголовок документа
          new Paragraph({
            text: 'NC CONSULTING',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'NC Decision Program — Экспертное заключение по мерам господдержки Фонда «Даму»',
                bold: true,
                size: 26,
                color: '17113D'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Дата формирования: ${new Date().toLocaleDateString('ru-RU')} | Информационная база: АО «ФРП «ДАМУ» (damu.kz)`,
                italics: true,
                size: 18,
                color: '666666'
              })
            ],
            spacing: { after: 280 }
          }),

          // Раздел 1. Исходные параметры запроса
          new Paragraph({
            text: '1. ИСХОДНЫЕ ПАРАМЕТРЫ ПРОЕКТА',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 180, after: 120 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Подтверждённый код ОКЭД: ', bold: true }),
              new TextRun({ text: `${query.oked_code} (${okedName})` })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Территория проекта: ', bold: true }),
              new TextRun({ text: `${query.location_name || 'Не указана'} (${query.location_level === 'city' ? 'Город' : 'Область'})` })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Институты финансирования: ', bold: true }),
              new TextRun({ text: 'Банки второго уровня РК (Halyk, Forte, БЦК, Bereke, Jusan и др.) в партнёрстве с АО «ФРП «ДАМУ»' })
            ],
            spacing: { after: 200 }
          }),

          // Раздел 2. Целевые программы по предоставленным данным
          new Paragraph({
            text: '2. ЦЕЛЕВЫЕ ПРОГРАММЫ ФИНАНСИРОВАНИЯ (ПО ПРЕДОСТАВЛЕННЫМ ДАННЫМ)',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 140 }
          }),

          ...corePrograms.flatMap((prog, idx) => [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${idx + 1}. ${prog.title}`,
                  bold: true,
                  size: 22,
                  color: '8B5CFF'
                })
              ],
              spacing: { before: 120, after: 60 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Инструмент поддержки: ', bold: true }),
                new TextRun({ text: prog.category })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Лимит финансирования: ', bold: true }),
                new TextRun({ text: prog.limit, bold: true, color: '006699' })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Ставка и субсидирование: ', bold: true }),
                new TextRun({ text: prog.rate })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Срок и целевое назначение: ', bold: true }),
                new TextRun({ text: `${prog.term} | ${prog.purposes}` })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Кто финансирует: ', bold: true }),
                new TextRun({ text: prog.financier })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Официальный регламент Damu: ', bold: true }),
                new TextRun({ text: `${prog.sourceId} (${prog.url})` })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Обоснование соответствия: ', bold: true, italics: true }),
                new TextRun({ text: prog.note, italics: true })
              ],
              spacing: { after: 160 }
            })
          ]),

          // Заключительная правовая часть
          new Paragraph({
            text: '3. РЕГЛАМЕНТ ПРИНЯТИЯ РЕШЕНИЯ',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Заключение сформировано строго на основании предоставленных параметров ОКЭД и территории. Окончательное решение о кредитовании и субсидировании принимается кредитным комитетом банка-партнёра и Фондом «Даму».',
                italics: true,
                size: 18,
                color: '555555'
              })
            ],
            spacing: { after: 200 }
          })
        ]
      }
    ]
  });

  return await Packer.toBlob(doc);
}
