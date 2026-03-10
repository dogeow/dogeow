'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckSquare,
  ExternalLink,
  FolderGit2,
  ArrowLeft,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Settings,
  Search,
  Square,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import {
  deleteWatchedPackage,
  deleteWatchedPackages,
  listWatchedPackages,
  previewRepoDependencies,
  refreshWatchedPackage,
  saveWatchedPackages,
  type RepoDependencyPreview,
  type RepoDependencyPreviewItem,
  type WatchedPackage,
  type WatchLevel,
} from '@/lib/api/repo-watch'

type SelectedDependency = RepoDependencyPreviewItem & {
  ecosystem: 'npm' | 'composer'
  manifest_path: string
  selected: boolean
}

type VersionFilter = 'all' | WatchLevel
type ToolView = 'packages' | 'repo-settings'

const VERSION_FILTER_OPTIONS: Array<{ value: VersionFilter; label: string }> = [
  { value: 'all', label: '全部更新' },
  { value: 'major', label: '只看大版本' },
  { value: 'minor', label: '只看功能版本' },
  { value: 'patch', label: '只看小版本' },
]

const DEFAULT_SAVE_LEVEL: WatchLevel = 'minor'

const formatDateTime = (value?: string | null) => {
  if (!value) return '暂无'

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

const repoKeyOf = (item: Pick<WatchedPackage, 'source_owner' | 'source_repo'>) =>
  item.source_owner && item.source_repo ? `${item.source_owner}/${item.source_repo}` : 'no-repo'

const repoLabelOf = (item: Pick<WatchedPackage, 'source_owner' | 'source_repo'>) =>
  repoKeyOf(item) === 'no-repo' ? '无仓库' : `${item.source_owner}/${item.source_repo}`

const getLeadingSymbolPrefix = (value?: string | null) => {
  if (!value) return ''

  const match = value.match(/^[^\d]*/)
  return match?.[0] ?? ''
}

const renderVersionDiff = (currentVersion?: string | null, latestVersion?: string | null) => {
  if (!latestVersion) {
    return <span>未知</span>
  }

  const currentParts = (currentVersion ?? '').split('.')
  const latestParts = latestVersion.split('.')

  return latestParts.map((part, index) => {
    const changed = currentParts[index] !== part

    return (
      <span
        key={`${part}-${index}`}
        className={changed ? 'text-green-600 dark:text-green-400' : ''}
      >
        {index > 0 ? '.' : ''}
        {part}
      </span>
    )
  })
}

export default function RepoWatchTool() {
  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState<RepoDependencyPreview | null>(null)
  const [dependencies, setDependencies] = useState<SelectedDependency[]>([])
  const [watchedPackages, setWatchedPackages] = useState<WatchedPackage[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [activeAction, setActiveAction] = useState<{
    id: number
    type: 'refresh' | 'cancel'
  } | null>(null)
  const [versionFilter, setVersionFilter] = useState<VersionFilter>('all')
  const [selectedRepoKey, setSelectedRepoKey] = useState<string>('all')
  const [toolView, setToolView] = useState<ToolView>('packages')
  const [repoSettingsPreview, setRepoSettingsPreview] = useState<RepoDependencyPreview | null>(null)
  const [repoSettingsPreviewCache, setRepoSettingsPreviewCache] = useState<
    Record<string, RepoDependencyPreview>
  >({})
  const [repoSettingsLoading, setRepoSettingsLoading] = useState(false)
  const [repoSettingsActionKey, setRepoSettingsActionKey] = useState<string | null>(null)

  const loadWatchedPackages = useCallback(async () => {
    try {
      const data = await listWatchedPackages()
      setWatchedPackages(data)
    } catch (error) {
      console.error('加载依赖关注列表失败', error)
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    void loadWatchedPackages()
  }, [loadWatchedPackages])

  const repoOptions = useMemo(() => {
    return [
      'all',
      ...Array.from(new Set(watchedPackages.map(item => repoKeyOf(item)))).sort((left, right) =>
        left.localeCompare(right)
      ),
    ]
  }, [watchedPackages])

  useEffect(() => {
    if (!repoOptions.includes(selectedRepoKey)) {
      setSelectedRepoKey('all')
    }
  }, [repoOptions, selectedRepoKey])

  useEffect(() => {
    if (selectedRepoKey === 'all' || selectedRepoKey === 'no-repo') {
      setToolView('packages')
    }
  }, [selectedRepoKey])

  const selectedCount = useMemo(
    () => dependencies.filter(item => item.selected).length,
    [dependencies]
  )

  const groupedDependencies = useMemo(() => {
    return dependencies.reduce<Record<string, SelectedDependency[]>>((acc, item) => {
      const key = `${item.ecosystem}:${item.manifest_path}`
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {})
  }, [dependencies])

  const filteredWatchedPackages = useMemo(() => {
    return watchedPackages.filter(item => {
      if (versionFilter !== 'all' && item.latest_update_type !== versionFilter) {
        return false
      }

      if (selectedRepoKey !== 'all' && repoKeyOf(item) !== selectedRepoKey) {
        return false
      }

      return true
    })
  }, [selectedRepoKey, versionFilter, watchedPackages])

  const groupedWatchedPackages = useMemo(() => {
    return filteredWatchedPackages.reduce<Record<string, WatchedPackage[]>>((acc, item) => {
      const key = repoKeyOf(item)
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {})
  }, [filteredWatchedPackages])

  const selectedRepoPackages = useMemo(() => {
    if (selectedRepoKey === 'all') {
      return []
    }

    return watchedPackages.filter(item => repoKeyOf(item) === selectedRepoKey)
  }, [selectedRepoKey, watchedPackages])

  const selectedRepoSample = selectedRepoPackages[0]
  const selectedRepoWatchedMap = useMemo(() => {
    const map = new Map<string, WatchedPackage>()

    for (const item of selectedRepoPackages) {
      map.set(`${item.ecosystem}:${item.manifest_path}:${item.package_name}`, item)
    }

    return map
  }, [selectedRepoPackages])

  const resetAddPanel = useCallback(() => {
    setShowAddPanel(false)
    setPreview(null)
    setDependencies([])
    setUrl('')
  }, [])

  useEffect(() => {
    const loadRepoSettings = async () => {
      if (toolView !== 'repo-settings' || !selectedRepoSample?.source_url) {
        return
      }

      const cacheKey = selectedRepoSample.source_url
      const cachedPreview = repoSettingsPreviewCache[cacheKey]
      if (cachedPreview) {
        setRepoSettingsPreview(cachedPreview)
        setRepoSettingsLoading(false)
        return
      }

      setRepoSettingsLoading(true)
      setRepoSettingsPreview(null)

      try {
        const result = await previewRepoDependencies(selectedRepoSample.source_url)
        setRepoSettingsPreview(result)
        setRepoSettingsPreviewCache(prev => ({
          ...prev,
          [cacheKey]: result,
        }))
      } catch (error) {
        console.error('加载仓库设置依赖失败', error)
        toast.error('加载仓库依赖失败，请重试')
      } finally {
        setRepoSettingsLoading(false)
      }
    }

    void loadRepoSettings()
  }, [repoSettingsPreviewCache, selectedRepoSample?.source_url, toolView])

  const handleAnalyze = useCallback(async () => {
    if (!url.trim()) {
      toast.error('请先输入 GitHub 仓库地址')
      return
    }

    setAnalyzing(true)

    try {
      const result = await previewRepoDependencies(url.trim())
      setPreview(result)
      setDependencies(
        result.manifests.flatMap(manifest =>
          manifest.dependencies.map(item => ({
            ...item,
            ecosystem: manifest.ecosystem,
            manifest_path: manifest.path,
            selected: true,
          }))
        )
      )
      setShowAddPanel(true)
      toast.success('依赖解析完成')
    } finally {
      setAnalyzing(false)
    }
  }, [url])

  const handleToggleDependency = useCallback((target: SelectedDependency, selected: boolean) => {
    setDependencies(prev =>
      prev.map(item =>
        item.ecosystem === target.ecosystem &&
        item.package_name === target.package_name &&
        item.manifest_path === target.manifest_path
          ? { ...item, selected }
          : item
      )
    )
  }, [])

  const toggleAll = useCallback((selected: boolean) => {
    setDependencies(prev => prev.map(item => ({ ...item, selected })))
  }, [])

  const handleSave = useCallback(async () => {
    if (!preview) {
      toast.error('请先解析仓库依赖')
      return
    }

    const selectedPackages = dependencies.filter(item => item.selected)
    if (selectedPackages.length === 0) {
      toast.error('请至少选择一个依赖包')
      return
    }

    setSaving(true)

    try {
      const saved = await saveWatchedPackages(
        preview.source,
        url.trim(),
        selectedPackages.map(item => ({
          ecosystem: item.ecosystem,
          package_name: item.package_name,
          manifest_path: item.manifest_path,
          current_version_constraint: item.current_version_constraint,
          normalized_current_version: item.normalized_current_version,
          current_version_source: item.current_version_source,
          watch_level: DEFAULT_SAVE_LEVEL,
          dependency_group: item.dependency_group,
        }))
      )

      setWatchedPackages(prev => {
        const merged = [...prev]
        saved.forEach(item => {
          const index = merged.findIndex(existing => existing.id === item.id)
          if (index >= 0) {
            merged[index] = item
          } else {
            merged.unshift(item)
          }
        })
        return merged
      })

      setSelectedRepoKey(repoKeyOf(saved[0]))
      resetAddPanel()
      toast.success(`已新增 ${saved.length} 个依赖关注`)
    } finally {
      setSaving(false)
    }
  }, [dependencies, preview, resetAddPanel, url])

  const handleRefresh = useCallback(async (id: number) => {
    setActiveAction({ id, type: 'refresh' })

    try {
      const item = await refreshWatchedPackage(id)
      setWatchedPackages(prev => prev.map(pkg => (pkg.id === id ? item : pkg)))
      toast.success('依赖更新已刷新')
    } finally {
      setActiveAction(null)
    }
  }, [])

  const handleCancelWatch = useCallback(async (id: number) => {
    setActiveAction({ id, type: 'cancel' })

    try {
      await deleteWatchedPackage(id)
      setWatchedPackages(prev => prev.filter(pkg => pkg.id !== id))
      toast.success('已取消关注')
    } finally {
      setActiveAction(null)
    }
  }, [])

  const handleToggleAllRepoSettings = useCallback(
    async (
      dependencies: Array<
        RepoDependencyPreviewItem & { ecosystem: 'npm' | 'composer'; manifest_path: string }
      >,
      nextWatched: boolean
    ) => {
      if (!selectedRepoSample || !repoSettingsPreview) {
        return
      }

      if (nextWatched) {
        const missingDependencies = dependencies.filter(
          item =>
            !selectedRepoWatchedMap.get(
              `${item.ecosystem}:${item.manifest_path}:${item.package_name}`
            )
        )
        if (missingDependencies.length === 0) {
          return
        }

        setRepoSettingsActionKey('toggle-all')

        try {
          const saved = await saveWatchedPackages(
            {
              provider: selectedRepoSample.source_provider,
              owner: selectedRepoSample.source_owner,
              repo: selectedRepoSample.source_repo,
              full_name: repoLabelOf(selectedRepoSample),
              html_url: selectedRepoSample.source_url,
              description: null,
            },
            selectedRepoSample.source_url,
            missingDependencies.map(item => ({
              ecosystem: item.ecosystem,
              package_name: item.package_name,
              manifest_path: item.manifest_path,
              current_version_constraint: item.current_version_constraint,
              normalized_current_version: item.normalized_current_version,
              current_version_source: item.current_version_source,
              watch_level: DEFAULT_SAVE_LEVEL,
              dependency_group: item.dependency_group,
            }))
          )

          setWatchedPackages(prev => {
            const merged = [...prev]
            for (const item of saved) {
              const index = merged.findIndex(existing => existing.id === item.id)
              if (index >= 0) {
                merged[index] = item
              } else {
                merged.push(item)
              }
            }
            return merged
          })
          toast.success(`已关注 ${saved.length} 个依赖`)
        } finally {
          setRepoSettingsActionKey(null)
        }

        return
      }

      const watchedDependencies = dependencies
        .map(item =>
          selectedRepoWatchedMap.get(`${item.ecosystem}:${item.manifest_path}:${item.package_name}`)
        )
        .filter((item): item is WatchedPackage => !!item)
      if (watchedDependencies.length === 0) {
        return
      }

      setRepoSettingsActionKey('toggle-all')

      try {
        await deleteWatchedPackages(watchedDependencies.map(item => item.id))
        setWatchedPackages(prev =>
          prev.filter(item => !watchedDependencies.some(watched => watched.id === item.id))
        )
        toast.success(`已取消关注 ${watchedDependencies.length} 个依赖`)
      } finally {
        setRepoSettingsActionKey(null)
      }
    },
    [repoSettingsPreview, selectedRepoSample, selectedRepoWatchedMap]
  )

  const handleToggleRepoSettingPackage = useCallback(
    async (dependency: SelectedDependency, watchedPackage?: WatchedPackage) => {
      const actionKey = `${dependency.ecosystem}:${dependency.manifest_path}:${dependency.package_name}`
      setRepoSettingsActionKey(actionKey)

      try {
        if (watchedPackage) {
          await deleteWatchedPackage(watchedPackage.id)
          setWatchedPackages(prev => prev.filter(item => item.id !== watchedPackage.id))
          toast.success('已取消关注')
          return
        }

        if (!selectedRepoSample) {
          return
        }

        const saved = await saveWatchedPackages(
          {
            provider: selectedRepoSample.source_provider,
            owner: selectedRepoSample.source_owner,
            repo: selectedRepoSample.source_repo,
            full_name: repoLabelOf(selectedRepoSample),
            html_url: selectedRepoSample.source_url,
            description: null,
          },
          selectedRepoSample.source_url,
          [
            {
              ecosystem: dependency.ecosystem,
              package_name: dependency.package_name,
              manifest_path: dependency.manifest_path,
              current_version_constraint: dependency.current_version_constraint,
              normalized_current_version: dependency.normalized_current_version,
              current_version_source: dependency.current_version_source,
              watch_level: DEFAULT_SAVE_LEVEL,
              dependency_group: dependency.dependency_group,
            },
          ]
        )

        setWatchedPackages(prev => {
          const merged = [...prev]
          for (const item of saved) {
            const index = merged.findIndex(existing => existing.id === item.id)
            if (index >= 0) {
              merged[index] = item
            } else {
              merged.push(item)
            }
          }
          return merged
        })
        toast.success('已加入关注')
      } finally {
        setRepoSettingsActionKey(null)
      }
    },
    [selectedRepoSample]
  )

  const isRepoFiltered = selectedRepoKey !== 'all'

  const renderPackageCard = (item: WatchedPackage) => (
    <div key={item.id} className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium">{item.package_name}</div>
            <Badge variant="outline">{item.ecosystem}</Badge>
            {item.latest_update_type ? (
              <Badge variant="outline">{item.latest_update_type}</Badge>
            ) : (
              <Badge variant="secondary">暂无更新类型</Badge>
            )}
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            {(() => {
              const prefix = getLeadingSymbolPrefix(item.current_version_constraint)
              const prefixPad = prefix ? (
                <span aria-hidden className="text-transparent select-none">
                  {prefix}
                </span>
              ) : null

              return (
                <>
                  <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2">
                    <span>当前约束：</span>
                    <span className="font-mono">{item.current_version_constraint || '未声明'}</span>
                  </div>
                  <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2">
                    <span>当前基线：</span>
                    <span className="font-mono">
                      {prefixPad}
                      {item.normalized_current_version || '未知'}
                    </span>
                  </div>
                  <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2">
                    <span>最新版本：</span>
                    <span className="font-mono">
                      {prefixPad}
                      {renderVersionDiff(item.normalized_current_version, item.latest_version)}
                    </span>
                  </div>
                </>
              )
            })()}
          </div>
          <div className="text-xs text-muted-foreground">
            最近检查：{formatDateTime(item.last_checked_at)}
          </div>
          {!isRepoFiltered ? (
            <div className="pt-1 text-right text-xs text-muted-foreground">
              来源仓库：{repoLabelOf(item)}
            </div>
          ) : null}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {item.registry_url ? (
              <DropdownMenuItem asChild>
                <a href={item.registry_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  打开包页
                </a>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              onClick={() => void handleRefresh(item.id)}
              disabled={activeAction?.id === item.id && activeAction.type === 'refresh'}
            >
              <RefreshCw className="h-4 w-4" />
              刷新
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => void handleCancelWatch(item.id)}
              disabled={activeAction?.id === item.id && activeAction.type === 'cancel'}
            >
              <X className="h-4 w-4" />
              取消关注
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {watchedPackages.length === 0 ? (
        <Card className="border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
          {showAddPanel ? (
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                <Input
                  placeholder="例如 https://github.com/laravel/framework"
                  value={url}
                  onChange={event => setUrl(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      void handleAnalyze()
                    }
                  }}
                />
                <Button variant="outline" onClick={resetAddPanel}>
                  取消
                </Button>
                <Button onClick={() => void handleAnalyze()} loading={analyzing}>
                  <Search className="h-4 w-4" />
                  解析仓库
                </Button>
              </div>
            </CardContent>
          ) : (
            <CardContent className="py-10">
              <EmptyState
                icon={<FolderGit2 className="h-10 w-10" />}
                title="还没有关注任何依赖"
                description="先添加一个仓库，再从解析结果里勾选要关注的包。"
              />
            </CardContent>
          )}
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>依赖更新追踪</CardTitle>
              <Button
                onClick={() => setShowAddPanel(current => !current)}
                variant={showAddPanel ? 'outline' : 'default'}
                className="ml-auto"
              >
                <Plus className="h-4 w-4" />
                添加仓库
              </Button>
            </div>
          </CardHeader>
          {showAddPanel ? (
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                <Input
                  placeholder="例如 https://github.com/vercel/next.js"
                  value={url}
                  onChange={event => setUrl(event.target.value)}
                />
                <Button variant="outline" onClick={resetAddPanel}>
                  取消
                </Button>
                <Button onClick={() => void handleAnalyze()} loading={analyzing}>
                  <Search className="h-4 w-4" />
                  解析仓库
                </Button>
              </div>
            </CardContent>
          ) : null}
        </Card>
      )}

      {preview ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <CardTitle>{preview.source.full_name}</CardTitle>
                <CardDescription>{preview.source.description || '暂无仓库描述'}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => toggleAll(true)}>
                  <CheckSquare className="h-4 w-4" />
                  全选
                </Button>
                <Button variant="outline" onClick={() => toggleAll(false)}>
                  <Square className="h-4 w-4" />
                  取消全选
                </Button>
                <Button variant="outline" asChild>
                  <a href={preview.source.html_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    打开仓库
                  </a>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              已解析 {dependencies.length} 个依赖，当前选中 {selectedCount} 个。
            </div>

            {Object.entries(groupedDependencies).map(([groupKey, items]) => (
              <div key={groupKey} className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{items[0]?.ecosystem}</Badge>
                  <Badge variant="outline">{items[0]?.manifest_path}</Badge>
                  <span className="text-sm text-muted-foreground">{items.length} 个包</span>
                </div>

                <div className="grid gap-3">
                  {items.map(item => (
                    <div
                      key={`${item.ecosystem}-${item.package_name}`}
                      className="grid gap-3 rounded-lg border p-3 md:grid-cols-[auto_minmax(0,1fr)]"
                    >
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={event => handleToggleDependency(item, event.target.checked)}
                        />
                        <span className="text-sm font-medium">关注</span>
                      </label>

                      <div className="min-w-0">
                        <div className="truncate font-medium">{item.package_name}</div>
                        <div className="text-sm text-muted-foreground">
                          当前约束：{item.current_version_constraint || '未声明'} · 归属：
                          {item.dependency_group || 'dependencies'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={resetAddPanel}>
                取消
              </Button>
              <Button onClick={() => void handleSave()} loading={saving}>
                <CheckSquare className="h-4 w-4" />
                保存关注
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {watchedPackages.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {toolView === 'repo-settings' ? (
            <Button variant="outline" onClick={() => setToolView('packages')}>
              <ArrowLeft className="h-4 w-4" />
              返回列表
            </Button>
          ) : null}
          <select
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            value={selectedRepoKey}
            onChange={event => setSelectedRepoKey(event.target.value)}
          >
            {repoOptions.map(item => (
              <option key={item} value={item}>
                {item === 'all' ? '全部' : item === 'no-repo' ? '无仓库' : item}
              </option>
            ))}
          </select>
          <select
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            value={versionFilter}
            onChange={event => setVersionFilter(event.target.value as VersionFilter)}
          >
            {VERSION_FILTER_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {selectedRepoSample && selectedRepoKey !== 'no-repo' ? (
            <Button
              variant={toolView === 'repo-settings' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setToolView('repo-settings')}
              aria-label="仓库设置"
              title="仓库设置"
            >
              <Settings className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      ) : null}

      {toolView === 'repo-settings' && selectedRepoSample ? (
        <Card>
          <CardHeader>
            <CardTitle>仓库设置</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span>当前仓库：{repoLabelOf(selectedRepoSample)}</span>
              {selectedRepoSample.source_url ? (
                <a
                  href={selectedRepoSample.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="打开仓库"
                  title="打开仓库"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {repoSettingsLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                正在加载仓库依赖...
              </div>
            ) : repoSettingsPreview ? (
              <div className="space-y-4">
                {repoSettingsPreview.manifests.map(manifest => (
                  <div key={`${manifest.ecosystem}:${manifest.path}`} className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{manifest.ecosystem}</Badge>
                      <Badge variant="outline">{manifest.path}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {
                          manifest.dependencies.filter(
                            dependency =>
                              !!selectedRepoWatchedMap.get(
                                `${manifest.ecosystem}:${manifest.path}:${dependency.package_name}`
                              )
                          ).length
                        }
                        /{manifest.dependencies.length} 个包
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={repoSettingsActionKey === 'toggle-all'}
                        onClick={() =>
                          void handleToggleAllRepoSettings(
                            manifest.dependencies.map(dependency => ({
                              ...dependency,
                              ecosystem: manifest.ecosystem,
                              manifest_path: manifest.path,
                            })),
                            manifest.dependencies.some(
                              dependency =>
                                !selectedRepoWatchedMap.get(
                                  `${manifest.ecosystem}:${manifest.path}:${dependency.package_name}`
                                )
                            )
                          )
                        }
                      >
                        {manifest.dependencies.some(
                          dependency =>
                            !selectedRepoWatchedMap.get(
                              `${manifest.ecosystem}:${manifest.path}:${dependency.package_name}`
                            )
                        )
                          ? '全选'
                          : '取消全选'}
                      </Button>
                    </div>
                    <div className="grid gap-2">
                      {manifest.dependencies.map(dependency => {
                        const key = `${manifest.ecosystem}:${manifest.path}:${dependency.package_name}`
                        const watchedPackage = selectedRepoWatchedMap.get(key)

                        return (
                          <label
                            key={key}
                            className="flex items-start gap-3 rounded-lg border px-3 py-2"
                          >
                            <input
                              type="checkbox"
                              checked={!!watchedPackage}
                              disabled={repoSettingsActionKey === key}
                              onChange={() =>
                                void handleToggleRepoSettingPackage(
                                  {
                                    ...dependency,
                                    ecosystem: manifest.ecosystem,
                                    manifest_path: manifest.path,
                                    selected: !!watchedPackage,
                                  },
                                  watchedPackage
                                )
                              }
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">{dependency.package_name}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                当前约束：{dependency.current_version_constraint || '未声明'} ·
                                当前基线：
                                {dependency.normalized_current_version || '未知'} · 分组：
                                {dependency.dependency_group || 'dependencies'}
                              </div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">暂无仓库依赖数据</div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            {loadingList ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                正在加载关注列表...
              </div>
            ) : filteredWatchedPackages.length === 0 ? (
              <EmptyState
                icon={<FolderGit2 className="h-10 w-10" />}
                title="当前筛选条件下没有结果"
                description="你可以切换仓库范围、更新类型，或者继续添加新的仓库依赖。"
              />
            ) : selectedRepoKey !== 'all' ? (
              <div className="space-y-4">
                {Object.entries(groupedWatchedPackages).map(([repoKey, items]) => (
                  <Card key={repoKey} className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-base">
                        {repoKey === 'no-repo' ? '无仓库' : repoKey}
                      </CardTitle>
                      <CardDescription>{items.length} 个已关注依赖</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">{items.map(renderPackageCard)}</CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">{filteredWatchedPackages.map(renderPackageCard)}</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
