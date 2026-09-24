import test from 'node:test';
import assert from 'node:assert/strict';
import { isAccessStatement, isLicenceText, isOpenLicence, isOtherWork } from '../lib/rules.mjs';

test('access statements are not licences', () => {
  for (const t of ['Open Access', 'Restricted Access', 'Closed Access', 'Embargoed access',
    'info:eu-repo/semantics/openAccess', 'info:eu-repo/semantics/restrictedAccess'])
    assert.equal(isLicenceText(t), false, t);
  for (const t of ['Creative Commons Attribution 4.0 International', 'CC BY 4.0',
    'These data are available to be used subject to the terms of use'])
    assert.equal(isLicenceText(t), true, t);
  assert.equal(isAccessStatement('Open Access'), true);
});

test('open means CC BY, CC BY-SA, CC0 or OSI; NC and ND are not open', () => {
  for (const t of ['Creative Commons Attribution 4.0 International', 'https://creativecommons.org/licenses/by/4.0/',
    'CC-BY-SA-4.0', 'CC0 1.0', 'https://creativecommons.org/publicdomain/zero/1.0/', 'MIT License', 'MIT',
    'Apache License 2.0', 'GPL-3.0', 'GNU General Public License v3.0', 'BSD-3-Clause', 'https://opensource.org/licenses/MIT'])
    assert.equal(isOpenLicence(t), true, t);
  for (const t of ['Creative Commons Attribution Non Commercial No Derivatives 4.0 International',
    'https://creativecommons.org/licenses/by-nc/4.0/', 'CC BY-NC-SA 4.0', 'CC BY-ND 4.0',
    '© Massachusetts Institute of Technology (MIT). All rights reserved.', 'Open Access', 'All rights reserved', ''])
    assert.equal(isOpenLicence(t), false, t);
});

test('a link to the dataset\'s own files or versions is not another work', () => {
  const doi = '10.34691/FK2/ABC123';
  assert.equal(isOtherWork({ relationType: 'HasPart', relatedIdentifier: '10.34691/FK2/ABC123/XYZ9' }, doi), false);
  assert.equal(isOtherWork({ relationType: 'IsPartOf', relatedIdentifier: '10.34691/fk2/abc123' }, doi + '/XYZ9'), false);
  assert.equal(isOtherWork({ relationType: 'IsVersionOf', relatedIdentifier: '10.5281/zenodo.1' }, '10.5281/zenodo.2'), false);
  assert.equal(isOtherWork({ relationType: 'References', relatedIdentifier: 'https://doi.org/10.1038/sdata.2016.18' }, doi), true);
  assert.equal(isOtherWork({ relationType: 'IsPartOf', relatedIdentifier: '10.34691/FK2/COLLECTION' }, doi), true);
  assert.equal(isOtherWork({ relationType: 'IsCitedBy', relatedIdentifier: '' }, doi), false);
});
