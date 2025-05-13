import { useState } from 'react'
import { toast } from "sonner"
import { 
  useAreas, 
  useRooms, 
  useSpots, 
  createArea, 
  updateArea, 
  deleteArea,
  createRoom,
  updateRoom,
  deleteRoom,
  createSpot,
  updateSpot,
  deleteSpot
} from '@/utils/api'

// 定义类型
export type LocationType = 'area' | 'room' | 'spot';
export type Area = { id: number; name: string; };
export type Room = { id: number; name: string; area_id: number; area?: { id: number; name: string; }; };
export type Spot = { id: number; name: string; room_id: number; room?: { id: number; name: string; area?: { id: number; name: string; } }; };

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
  
  // 添加区域
  const handleAddArea = async (name: string) => {
    if (!name.trim()) {
      toast.error("区域名称不能为空");
      return;
    }

    setLoading(true);
    try {
      await createArea({ name });
      toast.success("区域创建成功");
      refreshAreas();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建区域失败");
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // 更新区域
  const handleUpdateArea = async (areaId: number, newName: string) => {
    if (!newName.trim()) {
      toast.error("区域名称不能为空");
      return false;
    }

    setLoading(true);
    try {
      await updateArea(areaId)({ name: newName });
      toast.success("区域更新成功");
      refreshAreas();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新区域失败");
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // 添加房间
  const handleAddRoom = async (name: string, area_id: number) => {
    if (!name.trim()) {
      toast.error("房间名称不能为空");
      return false;
    }
    
    if (!area_id) {
      toast.error("请选择区域");
      return false;
    }

    setLoading(true);
    try {
      await createRoom({ name, area_id });
      toast.success("房间创建成功");
      refreshRooms();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建房间失败");
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // 更新房间
  const handleUpdateRoom = async (roomId: number, data: { name: string, area_id: number }) => {
    if (!data.name.trim()) {
      toast.error("房间名称不能为空");
      return false;
    }

    setLoading(true);
    try {
      await updateRoom(roomId)(data);
      toast.success("房间更新成功");
      refreshRooms();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新房间失败");
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // 添加位置
  const handleAddSpot = async (name: string, room_id: number) => {
    if (!name.trim()) {
      toast.error("位置名称不能为空");
      return false;
    }
    
    if (!room_id) {
      toast.error("请选择房间");
      return false;
    }

    setLoading(true);
    try {
      await createSpot({ name, room_id });
      toast.success("位置创建成功");
      refreshSpots();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建位置失败");
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // 更新位置
  const handleUpdateSpot = async (spotId: number, data: { name: string, room_id: number }) => {
    if (!data.name.trim()) {
      toast.error("位置名称不能为空");
      return false;
    }

    setLoading(true);
    try {
      await updateSpot(spotId)(data);
      toast.success("位置更新成功");
      refreshSpots();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新位置失败");
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // 删除确认
  const confirmDelete = (id: number, type: LocationType) => {
    setItemToDelete({ id, type });
    setDeleteDialogOpen(true);
  };
  
  // 执行删除
  const handleDelete = async () => {
    if (!itemToDelete) return false;

    setLoading(true);
    try {
      if (itemToDelete.type === 'area') {
        await deleteArea(itemToDelete.id);
        refreshAreas();
      } else if (itemToDelete.type === 'room') {
        await deleteRoom(itemToDelete.id);
        refreshRooms();
      } else if (itemToDelete.type === 'spot') {
        await deleteSpot(itemToDelete.id);
        refreshSpots();
      }
      
      const successMessages = {
        area: '区域删除成功',
        room: '房间删除成功',
        spot: '位置删除成功'
      };
      
      toast.success(successMessages[itemToDelete.type]);
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
  const handleLocationSelect = (type: LocationType, id: number, fullPath: string) => {
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