import { useState } from 'react'
import { toast } from "sonner"
import { 
  useAreas, 
  useRooms, 
  useSpots, 
  updateArea, 
  deleteArea,
  updateRoom,
  deleteRoom,
  updateSpot,
  deleteSpot,
  post
} from '@/lib/api'
import { getLocationTypeText } from '../constants'

// 定义类型
export type LocationType = 'area' | 'room' | 'spot';
export type Area = { id: number; name: string; };
export type Room = { 
  id: number; 
  name: string; 
  area_id: number; 
  area?: { id: number; name: string; }; 
};
export type Spot = { 
  id: number; 
  name: string; 
  room_id: number; 
  room?: { 
    id: number; 
    name: string; 
    area?: { id: number; name: string; } 
  }; 
};

export const useLocationManagement = () => {
  // 获取数据
  const { data: areas = [], mutate: refreshAreas } = useAreas();
  const { data: rooms = [], mutate: refreshRooms } = useRooms();
  const { data: spots = [], mutate: refreshSpots } = useSpots();
  
  // 通用状态
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{id: number, type: LocationType} | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{ type: LocationType, id: number } | undefined>(undefined)
  
  // 通用操作处理函数
  const handleOperation = async (
    operation: () => Promise<unknown>,
    successMessage: string,
    errorMessage: string,
    refreshFunction: () => void
  ) => {
    setLoading(true);
    try {
      await operation();
      toast.success(successMessage);
      refreshFunction();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 验证名称
  const validateName = (name: string, entityType: string): boolean => {
    if (!name.trim()) {
      toast.error(`${entityType}名称不能为空`);
      return false;
    }
    return true;
  };
  
  // 添加区域
  const handleAddArea = async (name: string) => {
    if (!validateName(name, "区域")) return false;
    return handleOperation(
      () => post<Area>('/areas', { name }),
      "区域创建成功",
      "创建区域失败",
      refreshAreas
    );
  };
  
  // 更新区域
  const handleUpdateArea = async (areaId: number, newName: string) => {
    if (!validateName(newName, "区域")) return false;
    return handleOperation(
      () => updateArea(areaId)({ name: newName }),
      "区域更新成功",
      "更新区域失败",
      refreshAreas
    );
  };
  
  // 添加房间
  const handleAddRoom = async (name: string, area_id: number) => {
    if (!validateName(name, "房间")) return false;
    if (!area_id) {
      toast.error("请选择区域");
      return false;
    }
    return handleOperation(
      () => post<Room>('/rooms', { name, area_id }),
      "房间创建成功",
      "创建房间失败",
      refreshRooms
    );
  };
  
  // 更新房间
  const handleUpdateRoom = async (roomId: number, data: { name: string, area_id: number }) => {
    if (!validateName(data.name, "房间")) return false;
    return handleOperation(
      () => updateRoom(roomId)(data),
      "房间更新成功",
      "更新房间失败",
      refreshRooms
    );
  };
  
  // 添加位置
  const handleAddSpot = async (name: string, room_id: number) => {
    if (!validateName(name, "位置")) return false;
    if (!room_id) {
      toast.error("请选择房间");
      return false;
    }
    return handleOperation(
      () => post<Spot>('/spots', { name, room_id }),
      "位置创建成功",
      "创建位置失败",
      refreshSpots
    );
  };
  
  // 更新位置
  const handleUpdateSpot = async (spotId: number, data: { name: string, room_id: number }) => {
    if (!validateName(data.name, "位置")) return false;
    return handleOperation(
      () => updateSpot(spotId)(data),
      "位置更新成功",
      "更新位置失败",
      refreshSpots
    );
  };
  
  // 删除确认
  const confirmDelete = (id: number, type: LocationType) => {
    setItemToDelete({ id, type });
    setDeleteDialogOpen(true);
  };
  
  // 执行删除
  const handleDelete = async () => {
    if (!itemToDelete) return false;

    const deleteOperations = {
      area: { fn: deleteArea, refresh: refreshAreas },
      room: { fn: deleteRoom, refresh: refreshRooms },
      spot: { fn: deleteSpot, refresh: refreshSpots }
    };
    
    const { fn, refresh } = deleteOperations[itemToDelete.type];
    const successMessage = `${getLocationTypeText(itemToDelete.type)}删除成功`;
    
    try {
      setLoading(true);
      await fn(itemToDelete.id);
      refresh();
      toast.success(successMessage);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败");
      return false;
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // 处理位置选择
  const handleLocationSelect = (type: LocationType, id: number) => {
    setSelectedLocation({ type, id });
  };

  return {
    // 数据
    areas,
    rooms,
    spots,
    // 状态
    loading,
    deleteDialogOpen,
    setDeleteDialogOpen,
    itemToDelete,
    selectedLocation,
    setSelectedLocation,
    // 操作方法
    handleAddArea,
    handleUpdateArea,
    handleAddRoom,
    handleUpdateRoom,
    handleAddSpot,
    handleUpdateSpot,
    confirmDelete,
    handleDelete,
    handleLocationSelect,
    // 刷新方法
    refreshAreas,
    refreshRooms,
    refreshSpots
  };
}; 