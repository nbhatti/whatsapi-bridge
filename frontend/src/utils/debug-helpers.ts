/**
 * Debug helpers to track re-renders and state changes
 * Useful for detecting infinite loops and performance issues
 */

export const createRenderTracker = (componentName: string) => {
  let renderCount = 0;
  let lastRenderTime = Date.now();
  const renderTimes: number[] = [];

  return {
    trackRender: () => {
      renderCount++;
      const now = Date.now();
      const timeSinceLastRender = now - lastRenderTime;
      renderTimes.push(timeSinceLastRender);
      
      // Keep only last 10 render times
      if (renderTimes.length > 10) {
        renderTimes.shift();
      }
      
      // Warning for potential infinite loops (more than 20 renders in 1 second)
      const recentRenders = renderTimes.filter(time => time < 50); // Less than 50ms between renders
      if (recentRenders.length > 20) {
        console.warn(`⚠️ [${componentName}] Potential infinite loop detected: ${renderCount} renders, ${recentRenders.length} rapid renders`);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 [${componentName}] Render #${renderCount} (${timeSinceLastRender}ms since last)`);
      }
      
      lastRenderTime = now;
      return renderCount;
    },
    
    getRenderCount: () => renderCount,
    
    getAverageRenderTime: () => {
      if (renderTimes.length === 0) return 0;
      return renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
    }
  };
};

export const trackStateUpdates = (stateName: string, value: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 [State Update] ${stateName}:`, value);
  }
};

export const trackEffectRuns = (effectName: string, dependencies?: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`⚡ [Effect] ${effectName} running`, dependencies ? `with deps: ${JSON.stringify(dependencies)}` : 'with no dependencies');
  }
};
