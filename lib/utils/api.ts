/**
 * API工具函数
 */

/**
 * 处理API响应
 */
export const handleApiResponse = async <T>(
  response: Response
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const result = await response.json()

    if (response.ok) {
      return { success: true, data: result.data || result }
    } else {
      return { success: false, error: result.message || '请求失败' }
    }
  } catch (error) {
    console.error('API响应处理错误:', error)
    return { success: false, error: '响应解析错误' }
  }
}

/**
 * 统一的API请求函数
 */
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || '/api'}/${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    return await handleApiResponse<T>(response)
  } catch (error) {
    console.error('API请求错误:', error)
    return { success: false, error: '网络请求失败' }
  }
}
