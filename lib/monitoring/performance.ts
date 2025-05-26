|// 性能监控工具
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // 记录页面加载时间
  recordPageLoad(pageName: string): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      
      this.metrics.set(`page_load_${pageName}`, loadTime);
      
      // 在开发环境下输出性能信息
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 页面加载时间 (${pageName}): ${loadTime.toFixed(2)}ms`);
      }
    }
  }

  // 记录 API 请求时间
  recordApiCall(endpoint: string, duration: number): void {
    this.metrics.set(`api_${endpoint}`, duration);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 API 请求时间 (${endpoint}): ${duration.toFixed(2)}ms`);
    }
  }

  // 记录组件渲染时间
  recordComponentRender(componentName: string, duration: number): void {
    this.metrics.set(`component_${componentName}`, duration);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚛️ 组件渲染时间 (${componentName}): ${duration.toFixed(2)}ms`);
    }
  }

  // 获取所有指标
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // 清除指标
  clearMetrics(): void {
    this.metrics.clear();
  }
}

// 创建性能监控实例
export const performanceMonitor = PerformanceMonitor.getInstance();

// Hook：监控 API 请求性能
export function useApiPerformance() {
  return {
    measureApiCall: async <T>(
      apiCall: () => Promise<T>,
      endpoint: string
    ): Promise<T> => {
      const startTime = performance.now();
      try {
        const result = await apiCall();
        const endTime = performance.now();
        performanceMonitor.recordApiCall(endpoint, endTime - startTime);
        return result;
      } catch (error) {
        const endTime = performance.now();
        performanceMonitor.recordApiCall(`${endpoint}_error`, endTime - startTime);
        throw error;
      }
    }
  };
} 