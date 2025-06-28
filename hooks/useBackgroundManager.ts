import { useEffect } from 'react'
import { useBackgroundStore } from '@/stores/backgroundStore'

export const useBackgroundManager = () => {
  const { backgroundImage, setBackgroundImage } = useBackgroundStore()
  
  useEffect(() => {
    if (!backgroundImage) {
      document.body.style.backgroundImage = '';
      return;
    }

    let imageUrl = '';
    
    // 系统背景图片
    if (backgroundImage.startsWith('wallhaven') || backgroundImage.startsWith('F_RIhiObMAA')) {
      imageUrl = `/images/backgrounds/${backgroundImage}`;
    } 
    // 自定义上传的背景图片（base64格式）
    else if (backgroundImage.startsWith('data:')) {
      imageUrl = backgroundImage;
    }
    
    if (imageUrl) {
      Object.assign(document.body.style, {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      });
    }
  }, [backgroundImage]);

  return { backgroundImage, setBackgroundImage }
} 