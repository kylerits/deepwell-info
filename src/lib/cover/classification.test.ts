import { expect, test } from 'vitest';
import { clearanceLevel, clearanceName, disruptionLevel, objectClassOf, riskLevel } from './classification';
import { objectClassLabel } from './acs';
import { seriesFromSlug, seriesLabel } from './series';

test('class precedence: base classes outrank terminal ones', () => {
  expect(objectClassOf(['neutralized', 'keter'])).toBe('keter');
  expect(objectClassLabel(['euclid', 'scp'])).toEqual({ label: 'EUCLID', tone: 'euclid' });
  expect(objectClassLabel(['tale'])).toBeNull();
});
test('ACS helpers', () => {
  expect(clearanceLevel('Level3')).toBe(3); expect(clearanceName(3)).toBe('Confidential');
  expect(disruptionLevel('ekhi')).toBe(4); expect(riskLevel('Notice')).toBe(1);
});
test('series from slug', () => {
  expect(seriesFromSlug('scp-173')).toBe(1); expect(seriesFromSlug('scp-2317')).toBe(3);
  expect(seriesFromSlug('scp-5000')).toBe(6); expect(seriesFromSlug('tale-duty')).toBeNull();
  expect(seriesLabel(5)).toBe('V');
});
