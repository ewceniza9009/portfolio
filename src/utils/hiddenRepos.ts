export const HIDDEN_PUBLIC_GITHUB_REPOS = [
  'EWC-OS Portfolio',
  'ewc-os-portfolio',
  'portfolio',
] as const

export const HIDDEN_PUBLIC_PROJECT_TAGS = [] as const

export function isHiddenRepo(name: string): boolean {
  return HIDDEN_PUBLIC_GITHUB_REPOS.some(
    (hidden) => hidden.toLowerCase() === name.toLowerCase(),
  )
}

export function filterPublicRepos<T extends { name: string }>(repos: T[]): T[] {
  return repos.filter((repo) => !isHiddenRepo(repo.name))
}
