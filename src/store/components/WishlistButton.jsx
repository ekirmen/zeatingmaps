import React, { useState, useEffect } from 'react';
import { Button, message, Popover, List, Empty, Typography } from '../../utils/antdComponents';
import { HeartOutlined, HeartFilled, DeleteOutlined } from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Text } = Typography;

const WishlistButton = ({ event, size = 'default' }) => {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wishlistVisible, setWishlistVisible] = useState(false);
  const [wishlistItems, setWishlistItems] = useState([]);

  useEffect(() => {
    checkWishlistStatus();
    loadWishlist();
  }, [event]);

  const checkWishlistStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !event) return;

      const { data, error } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', user.id)
        .eq('evento', event.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setIsInWishlist(!!data);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  };

  const loadWishlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          *,
          eventos (
            id,
            nombre,
            descripcion,
            imagen_url,
            fecha_evento
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWishlistItems(data || []);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
  };

  const toggleWishlist = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        message.warning('Debes iniciar sesión para guardar favoritos');
        return;
      }

      if (isInWishlist) {
        // Remover de wishlist
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('evento', event.id);

        if (error) throw error;

        message.success('Removido de favoritos');
        setIsInWishlist(false);
      } else {
        // Agregar a wishlist
        const { error } = await supabase
          .from('wishlist')
          .insert({
            user_id: user.id,
            evento: event.id,
            created_at: new Date().toISOString()
          });

        if (error) throw error;

        message.success('Agregado a favoritos');
        setIsInWishlist(true);
      }

      loadWishlist();
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      message.error('Error al actualizar favoritos');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (wishlistId) => {
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', wishlistId);

      if (error) throw error;

      message.success('Removido de favoritos');
      loadWishlist();
      checkWishlistStatus();
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      message.error('Error al remover de favoritos');
    }
  };

  const wishlistContent = (
    <div className="w-80">
      <div className="mb-4">
        <Text strong>Mis Favoritos</Text>
        <Text type="secondary" className="block text-sm">
          {wishlistItems.length} eventos guardados
        </Text>
      </div>

      {wishlistItems.length === 0 ? (
        <Empty
          description="No tienes eventos favoritos"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          size="small"
          dataSource={wishlistItems}
          renderItem={(item) => (
            <List.Item
              className="hover:bg-gray-50 p-2 rounded cursor-pointer"
              actions={[
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromWishlist(item.id);
                  }}
                  danger
                />
              ]}
            >
              <List.Item.Meta
                avatar={
                  <img
                    src={item.eventos?.imagen_url || '/default-event.jpg'}
                    alt={item.eventos?.nombre}
                    className="w-12 h-12 object-cover rounded"
                  />
                }
                title={
                  <Text strong className="text-sm">
                    {item.eventos?.nombre}
                  </Text>
                }
                description={
                  <div>
                    <Text type="secondary" className="text-xs">
                      {item.eventos?.descripcion?.slice(0, 50)}...
                    </Text>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(item.eventos?.fecha_evento).toLocaleDateString()}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}

      {wishlistItems.length > 0 && (
        <div className="text-center pt-4 border-t">
          <Button type="link" size="small">
            Ver todos los favoritos
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Popover
      content={wishlistContent}
      title={null}
      trigger="click"
      open={wishlistVisible}
      onOpenChange={setWishlistVisible}
      placement="bottomRight"
    >
      <Button
        type="text"
        icon={isInWishlist ? <HeartFilled /> : <HeartOutlined />}
        loading={loading}
        onClick={toggleWishlist}
        size={size}
        className={`${
          isInWishlist 
            ? 'text-red-500 hover:text-red-600' 
            : 'text-gray-600 hover:text-red-500'
        }`}
      />
    </Popover>
  );
};

export default WishlistButton; 

