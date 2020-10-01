/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
  addNamespace,
  formatForTsDoc,
  getObjectIdByAssetId,
  isCommonPathParameter,
  isCommonQueryParameter,
} from "./templateHelpers";
import { commonParameterPositions } from "../src/static/commonParameters";
import { ASSET_OBJECT_MAP } from "../scripts/config";

describe("When adding namespaces to individual content (types)", () => {
  it("Prefixes the namespace successfully ", () => {
    expect(addNamespace("foo", "types"))
      .toStrictEqual("types.foo");
  });

  it("Will not prefix void with a namespace", () => {
    expect(addNamespace("void", "types")).toStrictEqual("void");
  });

  it("Will not prefix object with a namespace", () => {
    expect(addNamespace("object", "types"))
      .toStrictEqual("object");
  });

  it("Will not prefix Object with a namespace", () => {
    expect(addNamespace("object", "types"))
      .toStrictEqual("object");
  });

  it("Throws an error when called with undfined content", () => {
    expect(() => addNamespace(null, "types")).toThrow("Invalid content");
  });

  it("Throws an error when called with null content", () => {
    expect(() => addNamespace(undefined, "types")).toThrow("Invalid content");
  });

  it("Throws an error when the type is not a valid string", () => {
    expect(() => addNamespace("Foo", null)).toThrow("Invalid namespace");
  });

  it("Throws an error when the type is empty string", () => {
    expect(() => addNamespace(" ", "types")).toThrow("Empty type found");
  });
});

describe("When adding namespaces to elements in a complex content (an array)", () => {
  it("Prefixes each element with a namespace", () => {
    expect(addNamespace("Array<Foo | Baa>", "types"))
      .toStrictEqual("Array<types.Foo | types.Baa>");
  });

  it("Correctly parses three elements in an array", () => {
    expect(addNamespace("Array<Foo | Baa | Bar>", "types"))
      .toStrictEqual("Array<types.Foo | types.Baa | types.Bar>");
  });

  it("Throws an error when the array is empty", () => {
    expect(() => addNamespace("Array<>", null)).toThrow();
  });

  it("Throws an error when adding a type to an empty array element", () => {
    expect(() => addNamespace("Array<Foo | | Baa>", null)).toThrow();
  });
});

describe("Test formatForTsDoc template help function", () => {
  it("returns empty string for empty string", () => {
    expect(formatForTsDoc("")).toStrictEqual("");
  });

  it('returns "test" for "test"', () => {
    expect(formatForTsDoc("test")).toStrictEqual("test");
  });

  it("returns already escaped tag", () => {
    expect(formatForTsDoc("this is a \\<tag\\>")).toStrictEqual(
      "this is a \\<tag\\>"
    );
  });

  it("returns escaped tag in brackets", () => {
    expect(formatForTsDoc("my {<tag>}")).toStrictEqual("my \\{\\<tag\\>\\}");
  });

  it("returns escaped tag for html", () => {
    expect(formatForTsDoc("this is a <tag>")).toStrictEqual("this is a \\<tag\\>");
  });

  it("returns escaped brackets for brackets", () => {
    expect(formatForTsDoc("this is {escaped}")).toStrictEqual(
      "this is \\{escaped\\}"
    );
  });

  it("returns unescaped newlines for escapeed newlines", () => {
    expect(formatForTsDoc("this is a newline\\n")).toStrictEqual(
      "this is a newline\n"
    );
  });

  it("returns newlines for newlines", () => {
    expect(formatForTsDoc("this is a newline\n")).toStrictEqual(
      "this is a newline\n"
    );
  });

  it("returns unescaped tabs for escaped tabs", () => {
    expect(formatForTsDoc("this is a\\ttab")).toStrictEqual("this is a tab");
  });

  it("returns tabs for tabs", () => {
    expect(formatForTsDoc("this is a\ttab")).toStrictEqual("this is a\ttab");
  });

  it("returns leading whitespace for 1 space in front", () => {
    expect(formatForTsDoc("\n this is an indented line")).toStrictEqual(
      "\n this is an indented line"
    );
  });

  it("returns leading whitespace for 3 spaces in front", () => {
    expect(formatForTsDoc("\n   this is an indented line")).toStrictEqual(
      "\n   this is an indented line"
    );
  });

  it("returns collapsed leading whitespace for 5 spaces in front", () => {
    expect(formatForTsDoc("\n     this is an indented line")).toStrictEqual(
      "\n   this is an indented line"
    );
  });

  it("returns whitespace for 5 spaces in middle", () => {
    expect(formatForTsDoc("\nthis is a spaced     line")).toStrictEqual(
      "\nthis is a spaced     line"
    );
  });
});

describe("Test isCommonPathParameter template help function", () => {
  it("returns false for null input", () => {
    expect(isCommonPathParameter(null)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isCommonPathParameter("")).toBe(false);
  });

  it("returns false for not a common parameter", () => {
    expect(isCommonPathParameter("not-a-common-parameter")).toBe(false);
  });

  it("returns true for a common parameter", () => {
    expect(isCommonPathParameter(commonParameterPositions.pathParameters[0])).toBe(true);
  });

  it("returns true for all common parameter", () => {
    commonParameterPositions.pathParameters.forEach((p) => {
      expect(isCommonPathParameter(p)).toBe(true);
    });
  });
});

describe("Test isCommonQueryParameter template help function", () => {
  it("returns false for null input", () => {
    expect(isCommonQueryParameter(null)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isCommonQueryParameter("")).toBe(false);
  });

  it("returns false for not a common parameter", () => {
    expect(isCommonQueryParameter("not-a-common-parameter")).toBe(false);
  });

  it("returns true for a common parameter", () => {
    expect(isCommonQueryParameter(commonParameterPositions.queryParameters[0]))
      .toBe(true);
  });

  it("returns true for all common parameter", () => {
    commonParameterPositions.queryParameters.forEach((p) => {
      expect(isCommonQueryParameter(p)).toBe(true);
    });
  });
});

describe("Test getObjectIdByAssetId template helper function", () => {
  it(`returns ${ASSET_OBJECT_MAP['assignments']} for 'assignments' input`, () => {
    expect(getObjectIdByAssetId("assignments")).toBe(ASSET_OBJECT_MAP["assignments"]);
  });

  it(`throws for 'KEY_NOT_FOUND' input`, () => {
    expect(() => getObjectIdByAssetId("KEY_NOT_FOUND")).toThrowError(`Missing CCDC object ID for "KEY_NOT_FOUND"`);
  });
});
