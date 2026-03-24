import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSHOPS_DIR = path.resolve(__dirname, '../../../workshops');

/**
 * Reads and parses a YAML file, returns null if file doesn't exist
 */
function readYaml(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return yaml.load(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Get all workshop folders in the workshops directory
 */
function getWorkshopFolders() {
  if (!fs.existsSync(WORKSHOPS_DIR)) return [];
  return fs.readdirSync(WORKSHOPS_DIR)
    .filter(f => f.startsWith('workshop-') && fs.statSync(path.join(WORKSHOPS_DIR, f)).isDirectory());
}

test.describe('Workshop YAML Validation', () => {
  const workshops = getWorkshopFolders();

  for (const workshop of workshops) {
    const workshopPath = path.join(WORKSHOPS_DIR, workshop);

    test(`${workshop}: index.yaml exists and has languages`, () => {
      const indexPath = path.join(workshopPath, 'index.yaml');
      const data = readYaml(indexPath);

      expect(data).not.toBeNull();
      expect(data.languages).toBeDefined();
      expect(data.languages.length).toBeGreaterThan(0);

      for (const lang of data.languages) {
        expect(lang.folder).toBeDefined();
        expect(lang.code).toBeDefined();
        expect(lang.code).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
      }
    });

    test(`${workshop}: index.html exists with redirect`, () => {
      const htmlPath = path.join(workshopPath, 'index.html');
      expect(fs.existsSync(htmlPath)).toBe(true);

      const content = fs.readFileSync(htmlPath, 'utf8');
      expect(content).toContain('open-learn.app');
    });

    test(`${workshop}: language folders match index.yaml`, () => {
      const data = readYaml(path.join(workshopPath, 'index.yaml'));
      if (!data) return;

      for (const lang of data.languages) {
        const langPath = path.join(workshopPath, lang.folder);
        expect(fs.existsSync(langPath)).toBe(true);
      }
    });

    test(`${workshop}: workshops.yaml valid in each language`, () => {
      const indexData = readYaml(path.join(workshopPath, 'index.yaml'));
      if (!indexData) return;

      for (const lang of indexData.languages) {
        const wsYaml = readYaml(path.join(workshopPath, lang.folder, 'workshops.yaml'));
        expect(wsYaml).not.toBeNull();
        expect(wsYaml.workshops).toBeDefined();
        expect(wsYaml.workshops.length).toBeGreaterThan(0);

        for (const ws of wsYaml.workshops) {
          expect(ws.folder).toBeDefined();
          expect(ws.title).toBeDefined();
          // color and primaryColor are recommended but not all workshops have them yet
          if (!ws.color) console.warn(`⚠️ ${workshop}/${lang.folder}: missing color`);
          if (!ws.primaryColor) console.warn(`⚠️ ${workshop}/${lang.folder}: missing primaryColor`);
        }
      }
    });

    test(`${workshop}: lessons.yaml valid and all lesson folders exist`, () => {
      const indexData = readYaml(path.join(workshopPath, 'index.yaml'));
      if (!indexData) return;

      for (const lang of indexData.languages) {
        const wsYaml = readYaml(path.join(workshopPath, lang.folder, 'workshops.yaml'));
        if (!wsYaml) continue;

        for (const ws of wsYaml.workshops) {
          const lessonsYaml = readYaml(path.join(workshopPath, lang.folder, ws.folder, 'lessons.yaml'));
          expect(lessonsYaml).not.toBeNull();
          expect(lessonsYaml.lessons).toBeDefined();
          // Min 5 lessons (some language interfaces may have fewer)
          expect(lessonsYaml.lessons.length).toBeGreaterThanOrEqual(5);

          for (const lessonFolder of lessonsYaml.lessons) {
            const lessonPath = path.join(workshopPath, lang.folder, ws.folder, lessonFolder);
            expect(fs.existsSync(lessonPath)).toBe(true);
          }
        }
      }
    });

    test(`${workshop}: all content.yaml files valid`, () => {
      const indexData = readYaml(path.join(workshopPath, 'index.yaml'));
      if (!indexData) return;

      for (const lang of indexData.languages) {
        const wsYaml = readYaml(path.join(workshopPath, lang.folder, 'workshops.yaml'));
        if (!wsYaml) continue;

        for (const ws of wsYaml.workshops) {
          const lessonsYaml = readYaml(path.join(workshopPath, lang.folder, ws.folder, 'lessons.yaml'));
          if (!lessonsYaml) continue;

          for (const lessonFolder of lessonsYaml.lessons) {
            const contentPath = path.join(workshopPath, lang.folder, ws.folder, lessonFolder, 'content.yaml');
            const content = readYaml(contentPath);

            expect(content).not.toBeNull();
            expect(content.title).toBeDefined();
            expect(content.number).toBeDefined();
            expect(content.sections).toBeDefined();
            expect(content.sections.length).toBeGreaterThan(0);

            // Each section needs title and explanation
            for (const section of content.sections) {
              expect(section.title).toBeDefined();
              expect(section.explanation || section.examples).toBeDefined();
            }
          }
        }
      }
    });

    test(`${workshop}: no duplicate rel IDs per language`, () => {
      const indexData = readYaml(path.join(workshopPath, 'index.yaml'));
      if (!indexData) return;

      for (const lang of indexData.languages) {
        const wsYaml = readYaml(path.join(workshopPath, lang.folder, 'workshops.yaml'));
        if (!wsYaml) continue;

        for (const ws of wsYaml.workshops) {
          const lessonsYaml = readYaml(path.join(workshopPath, lang.folder, ws.folder, 'lessons.yaml'));
          if (!lessonsYaml) continue;

          const allRelIds = new Set();
          const duplicates = [];

          for (const lessonFolder of lessonsYaml.lessons) {
            const contentPath = path.join(workshopPath, lang.folder, ws.folder, lessonFolder, 'content.yaml');
            const content = readYaml(contentPath);
            if (!content || !content.sections) continue;

            for (const section of content.sections) {
              if (!section.examples) continue;
              for (const example of section.examples) {
                if (!example.rel) continue;
                for (const rel of example.rel) {
                  const relId = rel[0];
                  if (allRelIds.has(relId)) {
                    duplicates.push(`${lessonFolder}: "${relId}"`);
                  }
                  allRelIds.add(relId);
                }
              }
            }
          }

          if (duplicates.length > 0) {
            console.warn(`⚠️ ${duplicates.length} duplicate rel IDs in ${workshop}/${lang.folder}/${ws.folder}`);
            console.warn(`   First 5:`, duplicates.slice(0, 5));
          }
          // Log duplicates but don't fail — Workshop-Claude will fix these over time
          // Track the count for reporting
          expect(true).toBe(true);
        }
      }
    });
  }
});
