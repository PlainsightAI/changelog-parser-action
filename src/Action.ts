import { ChangelogEntry } from "./Changelog";
import { ChangelogReader } from "./ChangelogReader";
import { ChangelogParser, ParseOptions } from "./ChangelogParser";

export class Action {
  constructor(private readonly basedir: string = "./") {}

  async run(
    version?: string | undefined,
    path?: string | undefined,
    options: ParseOptions = {}
  ): Promise<ChangelogEntry | undefined> {
    const changelogContent = await new ChangelogReader(this.basedir)
      .readChangelog(path);
    const changelog = ChangelogParser.parseChangelog(changelogContent, options);
    return version !== undefined
      ? changelog.getByVersion(version)
      : changelog.getLatestVersion();
  }
}
