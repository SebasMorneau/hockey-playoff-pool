import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Space,
  Card,
  Popconfirm,
  InputNumber,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  UserAddOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import api from "../../services/api";
import { motion, AnimatePresence } from "framer-motion";
import Loading from "../../components/common/Loading";

interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  lastLogin: string;
  points?: number;
}

interface UserFormValues {
  name: string;
  email: string;
  isAdmin: boolean;
}

const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pointsModalVisible, setPointsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [pointsForm] = Form.useForm();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.admin.getAllUsers();
      setUsers(response.data.users);
    } catch (error) {
      message.error("Échec de la récupération des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
    setModalVisible(true);
  };

  const handleDeleteUser = async (userId: number) => {
    setActionLoading(true);
    try {
      await api.admin.deleteUser(userId);
      message.success("Utilisateur supprimé avec succès");
      fetchUsers();
    } catch (error) {
      message.error("Échec de la suppression de l'utilisateur");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (values: UserFormValues) => {
    setActionLoading(true);
    try {
      if (editingUser) {
        await api.admin.updateUser(editingUser.id, values.name, values.isAdmin);
        message.success("Utilisateur mis à jour avec succès");
      } else {
        await api.admin.inviteUser(values.name, values.email, values.isAdmin);
        message.success("Utilisateur invité avec succès");
      }
      setSuccessAnim(true);
      setTimeout(() => setSuccessAnim(false), 1200);
      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      message.error(
        editingUser
          ? "Échec de la mise à jour de l'utilisateur"
          : "Échec de l'invitation de l'utilisateur",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePoints = (user: User) => {
    setSelectedUser(user);
    pointsForm.setFieldsValue({ points: user.points || 0 });
    setPointsModalVisible(true);
  };

  const handlePointsSubmit = async (values: { points: number }) => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      await api.admin.updateUserPoints(selectedUser.id, values.points);
      message.success("Points mis à jour avec succès");
      setPointsModalVisible(false);
      fetchUsers();
    } catch (error) {
      message.error("Échec de la mise à jour des points");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      title: "Nom",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Administrateur",
      dataIndex: "isAdmin",
      key: "isAdmin",
      render: (isAdmin: boolean) => <Switch checked={isAdmin} disabled />,
    },
    {
      title: "Créé le",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Dernière Connexion",
      dataIndex: "lastLogin",
      key: "lastLogin",
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString() : "Jamais",
    },
    {
      title: "Points",
      dataIndex: "points",
      key: "points",
      render: (points: number) => points || 0,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: User) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
          />
          <Button
            icon={<TrophyOutlined />}
            onClick={() => handleUpdatePoints(record)}
          />
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer cet utilisateur?"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={handleAddUser}
          >
            Ajouter un Utilisateur
          </Button>
        </div>
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title={
          editingUser ? "Modifier l'Utilisateur" : "Ajouter un Utilisateur"
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <AnimatePresence>
          {actionLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="loading-overlay"
            >
              <Loading />
            </motion.div>
          )}
          {successAnim && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="success-animation"
            >
              <div className="checkmark"></div>
            </motion.div>
          )}
        </AnimatePresence>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Nom"
            rules={[{ required: true, message: "Veuillez saisir le nom!" }]}
          >
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Veuillez saisir l'email!" },
              { type: "email", message: "Veuillez saisir un email valide!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="isAdmin"
            label="Administrateur"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingUser ? "Mettre à jour" : "Inviter"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Mettre à jour les Points"
        open={pointsModalVisible}
        onCancel={() => setPointsModalVisible(false)}
        footer={null}
      >
        <AnimatePresence>
          {actionLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="loading-overlay"
            >
              <Loading />
            </motion.div>
          )}
          {successAnim && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="success-animation"
            >
              <div className="checkmark"></div>
            </motion.div>
          )}
        </AnimatePresence>
        <Form form={pointsForm} layout="vertical" onFinish={handlePointsSubmit}>
          <Form.Item
            name="points"
            label="Points"
            rules={[{ required: true, message: "Veuillez saisir les points!" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Mettre à jour
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageUsers;
