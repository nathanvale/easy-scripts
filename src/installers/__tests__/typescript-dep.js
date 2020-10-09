/* eslint-disable jest/no-standalone-expect */
import { unquoteSerializer } from "../../helpers/serializers";

jest.mock("fs");
jest.mock("prompts");
jest.mock("../../utils");
jest.mock("../../jsonate");

expect.addSnapshotSerializer(unquoteSerializer);

let reloadMock, execCmdMock, promptsMock, printMock;

describe("typescript-dep", () => {
  beforeEach(() => {
    jest.resetModules();
    reloadMock = require("../../jsonate").packageManager().reload;
    printMock = require("../../utils").print;
    execCmdMock = require("../../utils").execCmd;
    promptsMock = require("prompts");
  });

  it("should return false when the user does not want a tsconfig.json file created for them", async () => {
    promptsMock.mockImplementationOnce(() => ({ shouldCreate: false }));
    const { installTypescriptDep } = require("../typescript-dep");
    const result = await installTypescriptDep();
    expect(result).toBe(false);
    expect(promptsMock).toHaveBeenCalledTimes(1);
    expect(printMock.mock.calls[0]).toMatchInlineSnapshot(`
  Array [
    WARNING: Missing typescript dependency!,
  ]
  `);
    expect(promptsMock.mock.calls[0]).toMatchInlineSnapshot(`
  Array [
    Object {
      initial: true,
      message: Install typescript?,
      name: shouldInstall,
      type: confirm,
    },
  ]
  `);
  });

  it("should return true and write to a file when the user asks to have a tsconfig.json created for them", async () => {
    promptsMock.mockImplementationOnce(() => ({ shouldInstall: true }));

    const { installTypescriptDep } = require("../typescript-dep");
    const result = await installTypescriptDep();
    expect(result).toBe(true);
    expect(reloadMock).toBeCalledTimes(1);
    expect(execCmdMock).toHaveBeenCalledTimes(1);
    expect(execCmdMock.mock.calls[0]).toMatchInlineSnapshot(`
  Array [
    yarn add -D typescript,
  ]
  `);
    expect(promptsMock).toHaveBeenCalledTimes(1);
    expect(promptsMock.mock.calls[0]).toMatchInlineSnapshot(`
  Array [
    Object {
      initial: true,
      message: Install typescript?,
      name: shouldInstall,
      type: confirm,
    },
  ]
  `);
  });
});
