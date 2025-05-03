import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Table,
  Space,
  message,
  Modal,
  Popconfirm,
  theme,
  Select,
  Card,
} from "antd";
import { DeleteOutlined, PlusOutlined, EditOutlined } from "@ant-design/icons";
import axiosInstance from "../../utils/axios";
import { getImageUrl } from "../../utils/imageUrl";
import { motion, AnimatePresence } from "framer-motion";
import Loading from "../../components/common/Loading";

const { Option } = Select;

interface Team {
  id: number;
  name: string;
  shortName: string;
  logoUrl?: string;
  conference: string;
  division: string;
  active: boolean;
}

type TeamFormValues = Omit<Team, "id" | "shortName">;

const CONFERENCES = ["Eastern", "Western"];
const DIVISIONS = {
  Eastern: ["Atlantic", "Metropolitan"],
  Western: ["Central", "Pacific"],
};

const ManageTeams: React.FC = () => {
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedConference, setSelectedConference] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/teams");
      setTeams(response.data.teams);
    } catch (error) {
      message.error("Échec de la récupération des équipes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (values: TeamFormValues) => {
    setActionLoading(true);
    try {
      await axiosInstance.post("/teams", values);
      setSuccessAnim(true);
      setTimeout(() => setSuccessAnim(false), 1200);
      message.success("Équipe créée avec succès");
      form.resetFields();
      setIsModalVisible(false);
      fetchTeams();
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      message.error(
        axiosError.response?.data?.message ||
          "Échec de la création de l'équipe",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTeam = async (values: TeamFormValues) => {
    if (!editingTeam) return;

    setActionLoading(true);
    try {
      await axiosInstance.put(`/teams/${editingTeam.id}`, values);
      message.success("Équipe mise à jour avec succès");
      setIsModalVisible(false);
      setEditingTeam(null);
      fetchTeams();
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      message.error(
        axiosError.response?.data?.message ||
          "Échec de la mise à jour de l'équipe",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTeam = async (id: number) => {
    setActionLoading(true);
    try {
      await axiosInstance.delete(`/teams/${id}`);
      message.success("Équipe supprimée avec succès");
      fetchTeams();
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      message.error(
        axiosError.response?.data?.message ||
          "Échec de la suppression de l'équipe",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const showEditModal = (team: Team) => {
    setEditingTeam(team);
    setSelectedConference(team.conference);
    form.setFieldsValue(team);
    setIsModalVisible(true);
  };

  const showCreateModal = () => {
    setEditingTeam(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingTeam(null);
    form.resetFields();
    setSelectedConference("");
  };

  const columns = [
    {
      title: "Logo",
      dataIndex: "logoUrl",
      key: "logo",
      render: (logoUrl: string) => (
        <img
          src={getImageUrl(logoUrl) || "/placeholder-team.png"}
          alt="Logo de l'équipe"
          style={{ width: 50, height: 50, objectFit: "contain" }}
        />
      ),
    },
    {
      title: "Nom",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Division",
      dataIndex: "division",
      key: "division",
    },
    {
      title: "Conférence",
      dataIndex: "conference",
      key: "conference",
    },
    {
      title: "Statut",
      dataIndex: "active",
      key: "active",
      render: (active: boolean) => (
        <span style={{ color: active ? token.colorSuccess : token.colorError }}>
          {active ? "Actif" : "Inactif"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: Team) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
          />
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer cette équipe?"
            onConfirm={() => handleDeleteTeam(record.id)}
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
            icon={<PlusOutlined />}
            onClick={showCreateModal}
          >
            Ajouter une Équipe
          </Button>
        </div>
        <Table
          dataSource={teams}
          columns={columns}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title={editingTeam ? "Modifier l'Équipe" : "Ajouter une Équipe"}
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
      >
        <AnimatePresence>
          {actionLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Loading />
            </motion.div>
          )}
          {successAnim && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Loading />
            </motion.div>
          )}
        </AnimatePresence>
        <Form
          form={form}
          layout="vertical"
          onFinish={editingTeam ? handleUpdateTeam : handleCreateTeam}
          initialValues={editingTeam || {}}
          style={{ color: token.colorText }}
        >
          <Form.Item
            name="name"
            label="Nom"
            rules={[{ required: true, message: "Veuillez saisir le nom!" }]}
          >
            <Input placeholder="Entrez le nom de l'équipe" />
          </Form.Item>

          <Form.Item
            name="logoUrl"
            label="URL du Logo"
            rules={[
              { required: true, message: "Veuillez saisir l'URL du logo" },
            ]}
          >
            <Input placeholder="Entrez l'URL du logo" />
          </Form.Item>

          <Form.Item
            name="conference"
            label="Conférence"
            rules={[
              { required: true, message: "Veuillez saisir la conférence!" },
            ]}
          >
            <Select
              placeholder="Sélectionnez la conférence"
              onChange={(value) => setSelectedConference(value)}
            >
              {CONFERENCES.map((conf) => (
                <Option key={conf} value={conf}>
                  {conf}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="division"
            label="Division"
            rules={[
              { required: true, message: "Veuillez saisir la division!" },
            ]}
          >
            <Select
              placeholder="Sélectionnez la division"
              disabled={!selectedConference}
            >
              {selectedConference &&
                DIVISIONS[selectedConference as keyof typeof DIVISIONS].map(
                  (div) => (
                    <Option key={div} value={div}>
                      {div}
                    </Option>
                  ),
                )}
            </Select>
          </Form.Item>

          {editingTeam && (
            <Form.Item name="active" label="Statut" valuePropName="checked">
              <Input type="checkbox" />
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingTeam ? "Mettre à jour" : "Créer"}
              </Button>
              <Button onClick={handleModalCancel}>Annuler</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageTeams;
