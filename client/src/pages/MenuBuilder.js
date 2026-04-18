import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, Settings, LayoutDashboard } from 'lucide-react';
import { apiFetch } from '../utils/api';
import './MenuBuilder.css';

function MenuBuilder() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    icon: '',
    route: '',
    content_type: 'static',
    order_index: 0
  });

  const iconOptions = [
    { value: 'LayoutDashboard', label: 'Dashboard' },
    { value: 'Settings', label: 'Settings' },
    { value: 'FileText', label: 'Document' },
    { value: 'Calendar', label: 'Calendar' },
    { value: 'Users', label: 'Users' },
    { value: 'Chart', label: 'Chart' },
    { value: 'Database', label: 'Database' },
    { value: 'Globe', label: 'Globe' },
    { value: 'Mail', label: 'Mail' },
    { value: 'Folder', label: 'Folder' },
    { value: 'Star', label: 'Star' },
    { value: 'Heart', label: 'Heart' }
  ];

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const data = await apiFetch('/api/admin/menu-items');
      setMenuItems(data.items || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setMessage('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      console.log('Saving menu item:', formData);
      if (editingItem) {
        await apiFetch(`/api/admin/menu-items/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        setMessage('Menu item updated successfully');
      } else {
        await apiFetch('/api/admin/menu-items', {
          method: 'POST',
          body: JSON.stringify({ ...formData, order_index: menuItems.length })
        });
        setMessage('Menu item created successfully');
      }

      setFormData({ title: '', icon: '', route: '', content_type: 'static', order_index: 0 });
      setEditingItem(null);
      setShowModal(false);
      fetchMenuItems();
    } catch (error) {
      console.error('Error saving menu item:', error);
      console.error('Error details:', JSON.stringify(error));
      const errorMessage = error.message || 'Failed to save menu item';
      setMessage(`Error: ${errorMessage}`);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      icon: item.icon,
      route: item.route,
      content_type: item.content_type,
      order_index: item.order_index
    });
    setShowModal(true);
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      await apiFetch(`/api/admin/menu-items/${itemId}`, { method: 'DELETE' });
      setMessage('Menu item deleted successfully');
      fetchMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      setMessage('Failed to delete menu item');
    }
  };

  const moveItem = (index, direction) => {
    const newItems = [...menuItems];
    const temp = newItems[index];
    newItems[index] = newItems[index + direction];
    newItems[index + direction] = temp;

    // Update order indices
    newItems.forEach((item, idx) => {
      item.order_index = idx;
    });

    setMenuItems(newItems);
    updateOrderIndices(newItems);
  };

  const updateOrderIndices = async (items) => {
    try {
      await Promise.all(
        items.map(item =>
          apiFetch(`/api/admin/menu-items/${item.id}`, {
            method: 'PUT',
            body: JSON.stringify({ order_index: item.order_index })
          })
        )
      );
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const openPageBuilder = (menuItem) => {
    // This will navigate to the page builder for this menu item
    window.location.href = `/app/page-builder?menuId=${menuItem.id}`;
  };

  return (
    <div className="menu-builder">
      <div className="menu-builder-header">
        <h1><LayoutDashboard size={28} /> Menu Builder</h1>
        <button
          className="add-button"
          onClick={() => {
            setEditingItem(null);
            setFormData({ title: '', icon: '', route: '', content_type: 'static', order_index: 0 });
            setShowModal(true);
          }}
        >
          <Plus size={20} /> Add Menu Item
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading menu items...</div>
      ) : (
        <div className="menu-items-list">
          {menuItems.length === 0 ? (
            <div className="empty-state">
              <Settings size={48} />
              <p>No custom menu items yet</p>
              <button onClick={() => setShowModal(true)}>
                <Plus size={20} /> Add Your First Menu Item
              </button>
            </div>
          ) : (
            menuItems.map((item, index) => (
              <div key={item.id} className="menu-item-card">
                <div className="menu-item-info">
                  <span className="menu-item-index">{index + 1}</span>
                  <div className="menu-item-details">
                    <h3>{item.title}</h3>
                    <p>Route: /app/{item.route}</p>
                    <small>Type: {item.content_type}</small>
                  </div>
                </div>
                <div className="menu-item-actions">
                  <button
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    title="Move Up"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => moveItem(index, 1)}
                    disabled={index === menuItems.length - 1}
                    title="Move Down"
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    onClick={() => openPageBuilder(item)}
                    title="Edit Page Content"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    title="Edit Menu Item"
                  >
                    <Settings size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
              <button onClick={() => setShowModal(false)} className="close-button">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Menu item title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Icon</label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                >
                  <option value="">Select an icon</option>
                  {iconOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Route *</label>
                <input
                  type="text"
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  placeholder="my-page"
                  required
                />
                <small>The route will be: /app/{formData.route}</small>
              </div>
              <div className="form-group">
                <label>Content Type</label>
                <select
                  value={formData.content_type}
                  onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                >
                  <option value="static">Static</option>
                  <option value="dynamic">Dynamic</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuBuilder;
