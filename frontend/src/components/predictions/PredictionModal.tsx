import React, { useState, useEffect } from "react";
import { Modal, Form, Button, message, Radio, Row, Col } from "antd";
import api from "../../services/api";
import Loading from "../common/Loading";

interface Team {
  id: number;
  name: string;
  shortName: string;
  logoUrl: string;
}

interface Series {
  id: number;
  Round: {
    name: string;
  };
  HomeTeam: Team;
  AwayTeam: Team;
  startDate?: string;
}

interface Prediction {
  id: number;
  predictedWinnerId: number;
  predictedGames: number;
}

interface PredictionModalProps {
  visible: boolean;
  series: Series | null;
  existingPrediction?: Prediction | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PredictionModal: React.FC<PredictionModalProps> = ({
  visible,
  series,
  existingPrediction,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<number | null>(null);
  const [selectedGames, setSelectedGames] = useState<number | null>(null);

  // Reset form on visibility change
  useEffect(() => {
    if (visible && series) {
      if (existingPrediction) {
        setSelectedWinner(existingPrediction.predictedWinnerId);
        setSelectedGames(existingPrediction.predictedGames);
        form.setFieldsValue({
          predictedWinnerId: existingPrediction.predictedWinnerId,
          predictedGames: existingPrediction.predictedGames,
        });
      } else {
        form.resetFields();
        setSelectedWinner(null);
        setSelectedGames(null);
      }
    }
  }, [visible, series, existingPrediction, form]);

  if (!series) return null;

  const handleTeamSelect = (teamId: number) => {
    console.log("Team selected:", teamId);
    setSelectedWinner(teamId);
    form.setFieldsValue({ predictedWinnerId: teamId });
  };

  const handleGamesSelect = (games: number) => {
    console.log("Games selected:", games);
    setSelectedGames(games);
    form.setFieldsValue({ predictedGames: games });
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();
      console.log("Submitting values:", values);

      setSubmitting(true);

      await api.predictions.submitPrediction({
        seriesId: series.id,
        predictedWinnerId: values.predictedWinnerId,
        predictedGames: values.predictedGames,
      });

      message.success(
        existingPrediction
          ? "Prédiction mise à jour avec succès!"
          : "Prédiction soumise avec succès!",
      );

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error submitting prediction:", error);
      message.error(
        existingPrediction
          ? "Échec de la mise à jour de la prédiction."
          : "Échec de la soumission de la prédiction.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const gameOptions = [4, 5, 6, 7].map((games) => ({
    label: `En ${games} matchs`,
    value: games,
  }));

  return (
    <Modal
      title={`${existingPrediction ? "Modifier" : "Faire"} une Prédiction: ${series.Round.name}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      maskClosable={!submitting}
      closable={!submitting}
      keyboard={!submitting}
      width={360}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <div style={{ marginBottom: 16, textAlign: "center" }}>
          <div style={{ marginBottom: 12 }}>
            Sélectionnez l&apos;équipe victorieuse:
          </div>

          <Form.Item
            name="predictedWinnerId"
            rules={[
              { required: true, message: "Veuillez sélectionner une équipe" },
            ]}
          >
            <Radio.Group
              buttonStyle="solid"
              onChange={(e) => handleTeamSelect(e.target.value)}
              style={{ width: "100%" }}
            >
              <Row gutter={[8, 8]}>
                <Col xs={12} md={6}>
                  <Radio.Button
                    value={series.HomeTeam.id}
                    style={{
                      width: "100%",
                      textAlign: "center",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {series.HomeTeam.shortName}
                  </Radio.Button>
                </Col>
                <Col xs={12} md={6}>
                  <Radio.Button
                    value={series.AwayTeam.id}
                    style={{
                      width: "100%",
                      textAlign: "center",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {series.AwayTeam.shortName}
                  </Radio.Button>
                </Col>
              </Row>
            </Radio.Group>
          </Form.Item>

          {selectedWinner && (
            <>
              <div style={{ marginTop: 16, marginBottom: 12 }}>
                Nombre de matchs:
              </div>
              <Form.Item
                name="predictedGames"
                rules={[
                  {
                    required: true,
                    message: "Veuillez sélectionner le nombre de matchs",
                  },
                ]}
              >
                <Radio.Group
                  buttonStyle="solid"
                  onChange={(e) => handleGamesSelect(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <Row gutter={[8, 8]}>
                    {gameOptions.map((option) => (
                      <Col xs={12} md={6} key={option.value}>
                        <Radio.Button
                          value={option.value}
                          style={{
                            width: "100%",
                            textAlign: "center",
                            height: "32px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {option.value}
                        </Radio.Button>
                      </Col>
                    ))}
                  </Row>
                </Radio.Group>
              </Form.Item>
            </>
          )}
        </div>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            disabled={!selectedWinner || !selectedGames || submitting}
            block
          >
            {existingPrediction
              ? "Mettre à jour ma prédiction"
              : "Soumettre ma prédiction"}
          </Button>
        </Form.Item>
      </Form>

      {submitting && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <Loading />
        </div>
      )}
    </Modal>
  );
};

export default PredictionModal;
