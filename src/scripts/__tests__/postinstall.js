/* eslint-disable jest/no-standalone-expect */
import { formatShortLog } from "../postinstall";

jest.mock("jest", () => ({ run: jest.fn() }));

describe("scripts", () => {
  it("should exclude Jenkins", () => {
    const logs = [
      "Author:\tJohn Doe <john.doe@origin.com.au>",
      "Author:\tJane Deer <jane.deer@origin.com.au>",
      "Author:\tJenkins <jenkins@origin.com.au>",
      "Author:\tJenkins <jenkins@originenergy.com.au>",
    ];

    const authors = formatShortLog(logs);

    expect(authors).toHaveLength(2);
    expect(authors.pop().name).toEqual("Jane Deer");
    expect(authors.pop().name).toEqual("John Doe");
  });
});
