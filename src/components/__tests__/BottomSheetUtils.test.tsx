import { describe, expect, it } from '@jest/globals';

import { getOpenDetents, getSheetFrame } from '../BottomSheet/utils';

describe('getOpenDetents', () => {
  it('fits a modal sheet to content shorter than half the window', () => {
    expect(
      getOpenDetents({
        detents: undefined,
        isModal: true,
        contentHeight: 300,
        windowHeight: 800,
      })
    ).toEqual(['content']);
  });

  it('first opens a modal sheet with taller content at half the window', () => {
    expect(
      getOpenDetents({
        detents: undefined,
        isModal: true,
        contentHeight: 600,
        windowHeight: 800,
      })
    ).toEqual([400, 'content']);
  });

  it('waits for the content of a modal sheet to be measured', () => {
    expect(
      getOpenDetents({
        detents: undefined,
        isModal: true,
        contentHeight: null,
        windowHeight: 800,
      })
    ).toBeNull();
  });

  it('fits a standard sheet to its content', () => {
    expect(
      getOpenDetents({
        detents: undefined,
        isModal: false,
        contentHeight: null,
        windowHeight: 800,
      })
    ).toEqual(['content']);
  });

  it('uses the given detents', () => {
    expect(
      getOpenDetents({
        detents: [120, '50%', 'content'],
        isModal: true,
        contentHeight: null,
        windowHeight: 800,
      })
    ).toEqual([120, '50%', 'content']);
  });

  it('throws for empty detents', () => {
    expect(() =>
      getOpenDetents({
        detents: [],
        isModal: true,
        contentHeight: null,
        windowHeight: 800,
      })
    ).toThrow('`detents` must contain at least one height');
  });
});

describe('getSheetFrame', () => {
  it('spans a compact window and keeps 72dp above the sheet', () => {
    expect(getSheetFrame(400, 24)).toEqual({
      maxWidth: undefined,
      topInset: 72,
    });
  });

  it('keeps 56dp around the sheet in a window wider than 640dp', () => {
    expect(getSheetFrame(700, 24)).toEqual({ maxWidth: 588, topInset: 56 });
    expect(getSheetFrame(1200, 24)).toEqual({ maxWidth: 640, topInset: 56 });
  });

  it('keeps the sheet below a status bar taller than the top margin', () => {
    expect(getSheetFrame(400, 80).topInset).toBe(80);
  });
});
