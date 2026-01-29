# Migration Milestones: @deriv-com/derivatives-charts ➜ @deriv-com/smartcharts-champion

Purpose

- Milestone-based implementation tracker for migrating from derivatives-charts to smartcharts-champion using the adapter pattern.
- Each milestone is self-contained with clear deliverables, acceptance criteria, and validation steps.
- Based on docs/adapter-design-smartcharts-champion.md and docs/migration-derivatives-charts-to-smartchart-champion.md.

Timeline Estimate: 3-5 days (depending on testing and validation)

---

## Milestone 1: Foundation Setup (Day 1)

**Goal**: Set up types, dependencies, and basic adapter structure without breaking existing functionality.

### Tasks

- [ ] 1.1 Add package dependency
    - Update package.json: add "@deriv-com/smartcharts-champion": "^X.Y.Z"
    - Remove or comment out "@deriv-com/derivatives-charts" (keep for rollback)
    - Run npm install

- [ ] 1.2 Create type definitions
    - Create `src/types/smartchart.types.ts`
    - Add TGranularity, TGetQuotesRequest, TGetQuotesResult, TQuote
    - Add ActiveSymbol, ActiveSymbols, TradingTimesMap
    - Ensure no TypeScript errors

- [ ] 1.3 Create adapter structure
    - Create `src/adapters/smartcharts-champion/types.ts`
    - Add TTransport, TServices, SmartchartsChampionAdapter interfaces
    - Create `src/adapters/smartcharts-champion/index.ts` (stub implementation)
    - Add buildSmartchartsChampionAdapter function signature

### Acceptance Criteria

- [ ] TypeScript compiles without errors
- [ ] New files are properly structured and importable
- [ ] Existing chart functionality still works (no breaking changes yet)
- [ ] Package.json updated with correct dependency

### Validation

```bash
npm run build
npm run type-check  # if available
```

### Rollback Plan

- Revert package.json changes
- Delete new type files
- Restore original imports

---

## Milestone 2: Adapter Implementation (Day 2)

**Goal**: Implement the core adapter logic with proper data transformations.

### Tasks

- [ ] 2.1 Implement transformation utilities
    - Add `toTGetQuotesResult(resp, granularity)` function
    - Add `toTQuoteFromStream(msg, granularity)` function
    - Add `toTradingTimesMap(src)` function
    - Unit test each transformation function

- [ ] 2.2 Implement getQuotes function
    - Handle ticks (granularity = 0) → history format
    - Handle candles (granularity > 0) → candles format
    - Support start/end/count parameters
    - Error handling for API failures

- [ ] 2.3 Implement subscribeQuotes function
    - Build correct subscribe request (ticks vs ticks_history)
    - Filter onMessage by subscription.id
    - Return proper unsubscribe function
    - Handle first response + streaming updates

- [ ] 2.4 Implement supporting functions
    - Add unsubscribeQuotes (convenience wrapper)
    - Add getChartData (activeSymbols + tradingTimes)
    - Integrate with existing ApiHelpers and trading-times services

### Acceptance Criteria

- [ ] All adapter functions implemented and typed correctly
- [ ] Transformations handle edge cases (empty data, missing fields)
- [ ] Subscription isolation works (only relevant messages forwarded)
- [ ] Unsubscribe properly cleans up both Rx and server subscriptions
- [ ] getChartData returns properly formatted activeSymbols and tradingTimes

### Validation

- [ ] Create test harness to verify transformations
- [ ] Test getQuotes with different granularities
- [ ] Test subscribeQuotes subscription/unsubscription cycle
- [ ] Verify getChartData returns expected structure

### Files Modified

- `src/adapters/smartcharts-champion/index.ts` (complete implementation)

---

## Milestone 3: Chart Integration (Day 3)

**Goal**: Wire the adapter to the Chart component and replace derivatives-charts.

### Tasks

- [ ] 3.1 Update Chart component imports
    - Replace `@deriv-com/derivatives-charts` imports with `@deriv-com/smartcharts-champion`
    - Update CSS import path
    - Import adapter builder function

- [ ] 3.2 Build adapter instance
    - Create transport object from chart_api.api
    - Create services object from ApiHelpers and trading-times
    - Build adapter using buildSmartchartsChampionAdapter
    - Use React.useMemo for adapter instance

- [ ] 3.3 Replace SmartChart props
    - Remove: requestAPI, requestSubscribe, requestForget, requestForgetStream, isConnectionOpened
    - Add: getQuotes, subscribeQuotes, unsubscribeQuotes from adapter
    - Add: chartData from adapter.getChartData()
    - Update toolbar/widget imports if needed

- [ ] 3.4 Update asset configuration
    - Update rsbuild.config.ts copy rules for smartcharts-champion assets
    - Remove derivatives-charts asset copying
    - Update or remove setSmartChartsPublicPath call in app-content.jsx

### Acceptance Criteria

- [ ] Chart component compiles without TypeScript errors
- [ ] SmartChart renders without console errors
- [ ] All required props are passed correctly
- [ ] Assets (CSS, fonts, shaders) load properly
- [ ] No references to old derivatives-charts package remain

### Validation

- [ ] Start development server
- [ ] Navigate to chart page
- [ ] Verify chart renders and loads CSS
- [ ] Check browser console for errors
- [ ] Verify no 404s for assets

### Files Modified

- `src/pages/chart/chart.tsx`
- `src/app/app-content.jsx` (setSmartChartsPublicPath)
- `rsbuild.config.ts` (asset copying)

---

## Milestone 4: Data Flow Validation (Day 4)

**Goal**: Ensure data flows correctly through the adapter and chart displays properly.

### Tasks

- [ ] 4.1 Validate history loading
    - Test ticks (granularity = 0) display correctly
    - Test candles (granularity > 0) display correctly
    - Test different time ranges and counts
    - Verify pagination works (scroll left for more history)

- [ ] 4.2 Validate live streaming
    - Test tick streaming updates chart in real-time
    - Test candle streaming updates chart in real-time
    - Verify only relevant subscription messages reach chart
    - Test symbol changes trigger new subscriptions

- [ ] 4.3 Validate reference data
    - Verify symbol dropdown populated from activeSymbols
    - Verify market open/close status from tradingTimes
    - Test symbol selection and switching
    - Verify pip sizes and display names correct

- [ ] 4.4 Validate lifecycle management
    - Test subscription cleanup on symbol change
    - Test subscription cleanup on component unmount
    - Verify no memory leaks or dangling subscriptions
    - Test reconnection scenarios

### Acceptance Criteria

- [ ] Historical data loads and displays correctly for all granularities
- [ ] Live data streams and updates chart in real-time
- [ ] Symbol switching works without ghost updates
- [ ] Market status and symbol metadata display correctly
- [ ] No subscription leaks or console errors
- [ ] Chart performance is acceptable

### Validation

- [ ] Manual testing of all chart interactions
- [ ] Monitor network tab for proper API calls
- [ ] Check for memory leaks in dev tools
- [ ] Test on different symbols and timeframes
- [ ] Verify mobile responsiveness if applicable

### Files to Monitor

- Browser console for errors
- Network tab for API calls
- Memory usage in dev tools

---

## Milestone 5: Edge Cases & Polish (Day 5)

**Goal**: Handle edge cases, error scenarios, and finalize the migration.

### Tasks

- [ ] 5.1 Handle error scenarios
    - Test behavior when market is closed
    - Test behavior when symbol is invalid
    - Test behavior when connection is lost
    - Add proper error boundaries and fallbacks

- [ ] 5.2 Handle special cases
    - Test delayed markets (delay_amount handling)
    - Test symbols with special characters
    - Test very old historical data requests
    - Verify contracts_array markers still work

- [ ] 5.3 Performance optimization
    - Optimize adapter instance creation
    - Minimize unnecessary re-renders
    - Optimize chartData updates
    - Review subscription management efficiency

- [ ] 5.4 Cleanup and documentation
    - Remove old derivatives-charts type definitions
    - Remove unused imports and code
    - Update any internal documentation
    - Add JSDoc comments to adapter functions

### Acceptance Criteria

- [ ] All error scenarios handled gracefully
- [ ] Special market conditions work correctly
- [ ] Performance is equivalent or better than before
- [ ] Code is clean and well-documented
- [ ] No dead code or unused dependencies remain

### Validation

- [ ] Comprehensive testing of edge cases
- [ ] Performance comparison with old implementation
- [ ] Code review for cleanliness
- [ ] Final integration testing

### Files Modified

- Various cleanup across adapter and chart files
- Remove `src/types/derivatives-charts.d.ts` if unused

---

## Post-Migration Checklist

### Immediate (Day 5)

- [ ] All milestones completed successfully
- [ ] No console errors in production build
- [ ] Chart functionality equivalent to previous version
- [ ] Performance metrics acceptable
- [ ] Documentation updated

### Short-term (Week 1)

- [ ] Monitor for any user-reported issues
- [ ] Verify analytics/tracking still works
- [ ] Check error reporting for new issues
- [ ] Validate on different browsers/devices

### Medium-term (Month 1)

- [ ] Remove derivatives-charts dependency completely
- [ ] Archive old implementation files
- [ ] Update any related documentation
- [ ] Consider additional smartcharts-champion features

---

## Risk Mitigation

### High-Risk Items

1. **Subscription leaks**: Carefully test unsubscribe logic
2. **Data transformation errors**: Validate all edge cases in transformations
3. **Performance regression**: Monitor chart rendering performance
4. **Asset loading issues**: Verify all CSS/fonts/shaders load correctly

### Rollback Strategy

Each milestone includes rollback steps. Key rollback points:

- After Milestone 1: Revert package.json and delete new files
- After Milestone 3: Revert Chart component changes
- After Milestone 5: Full rollback to derivatives-charts if needed

### Testing Strategy

- **Unit tests**: For transformation functions
- **Integration tests**: For adapter with mock transport
- **Manual tests**: For full chart functionality
- **Performance tests**: Compare before/after metrics

---

## Success Metrics

### Functional

- [ ] Chart displays historical data correctly
- [ ] Live streaming works without errors
- [ ] Symbol switching is smooth
- [ ] All UI interactions work as before

### Technical

- [ ] No memory leaks or subscription leaks
- [ ] Performance equivalent or better
- [ ] Bundle size not significantly increased
- [ ] TypeScript compilation clean

### User Experience

- [ ] No visual regressions
- [ ] Loading times acceptable
- [ ] Error states handled gracefully
- [ ] Mobile experience maintained

---

## Implementation Notes

### Daily Standup Questions

1. Which milestone tasks were completed yesterday?
2. Any blockers or issues encountered?
3. Which milestone tasks planned for today?
4. Any risks or concerns identified?

### Key Decision Points

- **Milestone 2**: Validate transformation logic thoroughly
- **Milestone 3**: Ensure smooth transition without breaking existing users
- **Milestone 4**: Performance and data accuracy are critical
- **Milestone 5**: Don't rush - edge cases matter

### Communication Plan

- Notify stakeholders before starting Milestone 3 (user-facing changes)
- Daily updates on progress and any issues
- Demo after Milestone 4 to validate functionality
- Final sign-off after Milestone 5 completion

This milestone tracker provides a structured approach to implementing the smartcharts-champion migration while minimizing risk and ensuring quality at each step.
