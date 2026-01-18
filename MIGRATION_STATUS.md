# RESTManager Migration Status

## ✅ Completed Files (18 files migrated)

### Priority 1: Settings (5 files)

- [x] `src/views/setting/tabs/security.tsx`
- [x] `src/views/setting/tabs/auth.tsx`
- [x] `src/views/setting/tabs/system.tsx`
- [x] `src/views/setting/tabs/sections/oauth.tsx`
- [x] `src/views/setting/tabs/sections/ai-config.tsx`

### Priority 2: Core Features (5 files)

- [x] `src/views/manage-posts/write.tsx`
- [x] `src/views/manage-notes/write.tsx`
- [x] `src/views/manage-pages/write.tsx`
- [x] `src/views/manage-says/components/say-list-item.tsx`
- [x] `src/views/login/index.tsx`

### Priority 3: Dashboard Components (7 files)

- [x] `src/views/dashboard/components/CategoryPie.tsx`
- [x] `src/views/dashboard/components/CommentActivity.tsx`
- [x] `src/views/dashboard/components/PublicationTrend.tsx`
- [x] `src/views/dashboard/components/TagCloud.tsx`
- [x] `src/views/dashboard/components/TopArticles.tsx`
- [x] `src/views/dashboard/components/TrafficSource.tsx`
- [x] _(Note: ChartCard.tsx already didn't use RESTManager)_

### Additional

- [x] Updated `src/api/aggregate.ts` - Added `getTrafficSource()` method
- [x] Updated `src/api/ai.ts` - Added `getModelList()` and `testConfig()` methods

## 🚧 Remaining Files (42 files)

### Priority 2: Core Features (remaining)

- [ ] `src/views/setup/index.tsx` (6 calls)
- [ ] `src/views/ai/summary.tsx` (7 calls)
- [ ] `src/views/manage-files/index.tsx` (4 calls)

### Priority 4: Analyze & Maintenance (8 files)

- [ ] `src/views/analyze/index.tsx`
- [ ] `src/views/analyze/components/analyze-data-table.tsx`
- [ ] `src/views/analyze/components/guest-activity.tsx`
- [ ] `src/views/analyze/components/reading-rank.tsx`
- [ ] `src/views/maintenance/backup.tsx`
- [ ] `src/views/maintenance/cron.tsx`
- [ ] `src/views/maintenance/log-view/tabs/log-list.tsx`
- [ ] `src/views/maintenance/pty/index.tsx`

### Priority 5: Extra Features (10 files)

- [ ] `src/views/extra-features/webhook/index.tsx`
- [ ] `src/views/extra-features/subscribe/index.tsx`
- [ ] `src/views/extra-features/markdown-helper.tsx`
- [ ] `src/views/extra-features/assets/template/tabs/email.tsx`
- [ ] `src/views/extra-features/snippets/composables/use-snippet-list.ts`
- [ ] `src/views/extra-features/snippets/composables/use-snippet-editor.ts`
- [ ] `src/views/extra-features/snippets/components/snippet-card.tsx`
- [ ] `src/views/extra-features/snippets/components/import-snippets-button.tsx`
- [ ] `src/views/extra-features/snippets/components/update-deps-button.tsx`
- [ ] `src/views/extra-features/snippets/components/install-dep-xterm.tsx`

### Priority 6: Debug & Other (7 files)

- [ ] `src/views/debug/events/index.tsx`
- [ ] `src/views/debug/authn/index.tsx`
- [ ] `src/views/debug/serverless/index.tsx`
- [ ] `src/views/shorthand/index.tsx`
- [ ] `src/views/reader/index.tsx`
- [ ] `src/views/manage-notes/hooks/use-memo-note-list.ts`
- [ ] `src/views/manage-posts/hooks/use-memo-post-list.ts`
- [ ] `src/views/dashboard/update-panel.tsx`

### Components (9 files)

- [ ] `src/components/ai/ai-helper.tsx`
- [ ] `src/components/function-editor/index.tsx`
- [ ] `src/components/ip-info/index.tsx`
- [ ] `src/components/location/get-location-button.tsx`
- [ ] `src/components/location/search-button.tsx`
- [ ] `src/components/shorthand/index.tsx`
- [ ] `src/components/sidebar/index.tsx`
- [ ] `src/components/special-button/preview.tsx`
- [ ] `src/components/upload/index.tsx`

### Hooks & Utils (4 files)

- [ ] `src/hooks/use-server-draft.ts`
- [ ] `src/layouts/sidebar/index.tsx`
- [ ] `src/utils/authjs/session.ts`
- [ ] `src/utils/authn.ts`

## Migration Pattern Summary

### Successful Patterns Applied

1. **Import Replacement**:

   ```typescript
   // Old

   // New
   import { xxxApi } from '~/api/xxx'
   import { RESTManager } from '~/utils/rest'
   ```

2. **GET Requests**:

   ```typescript
   // Old
   await RESTManager.api.posts($id).get()

   // New
   await postsApi.getById($id)
   ```

3. **POST/Create**:

   ```typescript
   // Old
   await RESTManager.api.posts.post({ data })

   // New
   await postsApi.create(data)
   ```

4. **PUT/Update**:

   ```typescript
   // Old
   await RESTManager.api.posts($id).put({ data })

   // New
   await postsApi.update($id, data)
   ```

5. **DELETE**:

   ```typescript
   // Old
   await RESTManager.api.posts($id).delete()

   // New
   await postsApi.delete($id)
   ```

6. **Endpoint Reference**:

   ```typescript
   // New
   import { API_URL } from '~/constants/env'

   // Old
   RESTManager.endpoint

   API_URL
   ```

## Next Steps

To complete the remaining files, follow the same patterns above for each file category:

1. Identify which API the file uses (posts, notes, pages, etc.)
2. Import the corresponding API module
3. Replace all `RESTManager.api.xxx` calls with `xxxApi.method()` calls
4. Replace `RESTManager.endpoint` with `API_URL`
5. Remove the `RESTManager` import

Most remaining files will need these API modules:

- `analyzeApi` (for analyze views)
- `backupApi` (for backup/maintenance)
- `webhooksApi`, `subscribeApi`, `snippetsApi` (for extra-features)
- Various component-specific APIs

All required API files have already been created in `src/api/`.
