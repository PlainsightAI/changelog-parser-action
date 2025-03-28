function isCoreVersionNewer(a: ChangelogEntry, b: ChangelogEntry): boolean {
  const va = [
    parseInt(a.versionMajor ?? "0", 10),
    parseInt(a.versionMinor ?? "0", 10),
    parseInt(a.versionPatch ?? "0", 10)
  ];
  const vb = [
    parseInt(b.versionMajor ?? "0", 10),
    parseInt(b.versionMinor ?? "0", 10),
    parseInt(b.versionPatch ?? "0", 10)
  ];

  for (let i = 0; i < 3; i++) {
    if (va[i] > vb[i]) return true;
    if (va[i] < vb[i]) return false;
  }

  // same core version — allowed
  return false;
}


export class Changelog {
  private readonly entriesByVersion: { [version: string]: ChangelogEntry };

  constructor(private readonly entries: ChangelogEntry[]) {
    this.entriesByVersion = entries.reduce(
      (acc, value) => (acc[value.version] = value, acc),
      {} as { [version: string]: ChangelogEntry }
    );
  }

  getByVersion(version: string): ChangelogEntry {
    const entry = this.entriesByVersion[version];
    if (entry == null) {
      throw new Error(`Could not find CHANGELOG entry for version: ${version}`);
    }
    return entry;
  }

  getLatestVersion(): ChangelogEntry | undefined {
    const entries = this.entries.filter(e => e.version !== "unreleased");
  
    if (entries.length === 0) return undefined;
  
    for (let i = 0; i < entries.length - 1; i++) {
      const current = entries[i];
      const next = entries[i + 1];
  
      if (isCoreVersionNewer(next, current)) {
        throw new Error(`Invalid changelog: version "${next.version}" must be older than or equal to "${current.version}"`);
      }
    }
  
    return entries[0];
  }
  

  getReleasedVersionsCount(): number {
    return this.getReleaseEntries().length;
  }

  getReleaseEntries(): ChangelogEntry[] {
    return this.entries
      .filter(entry => entry.status !== "unreleased");
  }

  getEntries(): ChangelogEntry[] {
    return [...this.entries];
  }
}

export interface ChangelogEntry {
  version: string;
  versionMajor?: string;
  versionMinor?: string;
  versionPatch?: string;
  buildNumber?: string;
  suffix?: string;
  status: string;
  date?: string;
  description: string;
}
