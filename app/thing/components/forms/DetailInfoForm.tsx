import { useState, useEffect } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from 'date-fns'
import LocationTreeSelect from '../LocationTreeSelect'
import { apiRequest } from '@/lib/api'
import { ItemFormData } from '../../types'
import { Location, LocationType, SelectedLocation } from '../../add/page'

interface DetailInfoFormProps {
  formMethods: UseFormReturn<ItemFormData>;
  watchAreaId: string;
  watchRoomId: string;
  watchSpotId: string;
  setValue: unknown;
}

export default function DetailInfoForm({
  formMethods,
  watchAreaId,
  watchRoomId,
  watchSpotId,
  setValue
}: DetailInfoFormProps) {
  const { control } = formMethods
  const [areas, setAreas] = useState<Location[]>([])
  const [rooms, setRooms] = useState<Location[]>([])
  const [spots, setSpots] = useState<Location[]>([])
  const [locationPath, setLocationPath] = useState<string>('')
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation>(undefined)

  // 加载区域数据
  const loadAreas = async () => {
    try {
      const data = await apiRequest<Location[]>('/areas')
      setAreas(data)
      return data
    } catch (error) {
      console.error('加载区域失败', error)
      return []
    }
  }

  // 加载房间数据
  const loadRooms = async (areaId: string) => {
    if (!areaId) {
      setRooms([])
      return []
    }
    
    try {
      const data = await apiRequest<Location[]>(`/areas/${areaId}/rooms`)
      setRooms(data)
      return data
    } catch (error) {
      console.error('加载房间失败', error)
      return []
    }
  }

  // 加载位置数据
  const loadSpots = async (roomId: string) => {
    if (!roomId) {
      setSpots([])
      return []
    }
    
    try {
      const data = await apiRequest<Location[]>(`/rooms/${roomId}/spots`)
      setSpots(data)
      return data
    } catch (error) {
      console.error('加载位置失败', error)
      return []
    }
  }
  
  // 处理位置选择
  const handleLocationSelect = (type: LocationType, id: number, fullPath: string) => {
    setSelectedLocation({ type, id })
    setLocationPath(fullPath)
    
    // 更新表单数据
    if (type === 'area') {
      setValue('area_id', id.toString())
      setValue('room_id', '')
      setValue('spot_id', '')
    } else if (type === 'room') {
      setValue('room_id', id.toString())
      setValue('spot_id', '')
      
      // 查找该房间所属的区域
      const room = rooms.find(r => r.id === id)
      if (room?.area_id) {
        setValue('area_id', room.area_id.toString())
      }
    } else if (type === 'spot') {
      setValue('spot_id', id.toString())
      
      // 查找该位置所属的房间
      const spot = spots.find(s => s.id === id)
      if (spot?.room_id) {
        setValue('room_id', spot.room_id.toString())
        
        // 查找该房间所属的区域
        const room = rooms.find(r => r.id === spot.room_id)
        if (room?.area_id) {
          setValue('area_id', room.area_id.toString())
        }
      }
    }
  }

  // 检查位置数据是否正在加载
  const isLocationLoading = (areaId?: string, roomId?: string, spotId?: string) => {
    if (areaId && areas.length === 0) return true;
    if (roomId && rooms.length === 0) return true;
    if (spotId && spots.length === 0) return true;
    return false;
  };

  // 更新位置路径显示
  const updateLocationPath = (areaId?: string, roomId?: string, spotId?: string) => {
    let path = '';
    
    // 有区域ID
    if (areaId && areas.length > 0) {
      const area = areas.find(a => a.id.toString() === areaId);
      if (area) {
        path = area.name;
        
        // 有房间ID
        if (roomId && rooms.length > 0) {
          const room = rooms.find(r => r.id.toString() === roomId);
          if (room) {
            path += ` > ${room.name}`;
            
            // 有具体位置ID
            if (spotId && spots.length > 0) {
              const spot = spots.find(s => s.id.toString() === spotId);
              if (spot) {
                path += ` > ${spot.name}`;
              }
            }
          }
        }
      }
    }
    
    // 如果构建了路径，更新显示
    if (path) {
      setLocationPath(path);
      
      // 设置选中的位置类型
      if (spotId && spots.length > 0) {
        setSelectedLocation({ type: 'spot', id: Number(spotId) });
      } else if (roomId && rooms.length > 0) {
        setSelectedLocation({ type: 'room', id: Number(roomId) });
      } else if (areaId && areas.length > 0) {
        setSelectedLocation({ type: 'area', id: Number(areaId) });
      }
    } else if (!areaId && !roomId && !spotId) {
      // 如果没有任何位置ID，清空路径
      setLocationPath('');
      setSelectedLocation(undefined);
    }
  };

  // 初始加载区域数据
  useEffect(() => {
    loadAreas();
  }, []);

  // 当选择区域时加载房间
  useEffect(() => {
    loadRooms(watchAreaId);
  }, [watchAreaId]);
  
  // 当选择房间时加载位置
  useEffect(() => {
    loadSpots(watchRoomId);
  }, [watchRoomId]);
  
  // 当位置信息变化时，更新位置路径显示
  useEffect(() => {
    updateLocationPath(watchAreaId, watchRoomId, watchSpotId);
  }, [watchAreaId, watchRoomId, watchSpotId, areas, rooms, spots]);

  // 渲染位置信息提示
  const renderLocationInfo = () => {
    if (locationPath) {
      return <p className="text-sm text-muted-foreground mt-2">{locationPath}</p>;
    }
    
    if (isLocationLoading(watchAreaId, watchRoomId, watchSpotId)) {
      return <p className="text-sm text-amber-500 mt-2">位置信息加载中...</p>;
    }
    
    if (watchAreaId || watchRoomId || watchSpotId) {
      return <p className="text-sm text-orange-500 mt-2">位置数据不完整，请重新选择</p>;
    }
    
    return <p className="text-sm text-muted-foreground mt-2">未指定位置</p>;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="purchase_date">购买日期</Label>
            <Controller
              name="purchase_date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  date={field.value ? new Date(field.value) : null}
                  setDate={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : null)}
                  placeholder="选择日期"
                />
              )}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expiry_date">过期日期</Label>
            <Controller
              name="expiry_date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  date={field.value ? new Date(field.value) : null}
                  setDate={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : null)}
                  placeholder="选择日期"
                />
              )}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="purchase_price">购买价格</Label>
            <Controller
              name="purchase_price"
              control={control}
              render={({ field }) => (
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={field.value !== null ? field.value : ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                />
              )}
            />
          </div>
        </div>
        
        <div className="mt-6">
          <Label className="mb-2 block">存放位置</Label>
          <LocationTreeSelect 
            onSelect={handleLocationSelect}
            selectedLocation={selectedLocation}
          />
          {renderLocationInfo()}
        </div>
      </CardContent>
    </Card>
  )
}