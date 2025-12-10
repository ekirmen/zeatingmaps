import React, { useState, useEffect } from 'react';
import { Card, Steps, Button, Typography, Space, Tag, Progress, Modal, List, Avatar, Checkbox } from '../../utils/antdComponents';
import { 
  PlayCircleOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  UserOutlined,
  BookOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text, Paragraph } = Typography;

const InteractiveTutorials = () => {
  const [tutorials, setTutorials] = useState([]);
  const [currentTutorial, setCurrentTutorial] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userProgress, setUserProgress] = useState({});

  const difficultyColors = {
    beginner: 'green',
    intermediate: 'orange',
    advanced: 'red'
  };

  const difficultyLabels = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado'
  };

  useEffect(() => {
    loadTutorials();
    loadUserProgress();
  }, []);

  const loadTutorials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('interactive_tutorials')
        .select('*')
        .eq('is_published', true)
        .order('category, order_index');

      if (error) throw error;
      setTutorials(data || []);
    } catch (error) {
      console.error('Error loading tutorials:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tutorial_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const progressMap = {};
      data?.forEach(progress => {
        progressMap[progress.tutorial_id] = {
          currentStep: progress.current_step,
          completedSteps: progress.completed_steps || [],
          isCompleted: progress.is_completed
        };
      });

      setUserProgress(progressMap);
    } catch (error) {
      console.error('Error loading user progress:', error);
    }
  };

  const startTutorial = (tutorial) => {
    setCurrentTutorial(tutorial);
    const progress = userProgress[tutorial.id];
    setCurrentStep(progress?.currentStep || 0);
    setCompletedSteps(progress?.completedSteps || []);
    setModalVisible(true);
  };

  const nextStep = async () => {
    if (!currentTutorial) return;

    const newCompletedSteps = [...completedSteps, currentStep];
    setCompletedSteps(newCompletedSteps);

    if (currentStep < currentTutorial.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Tutorial completado
      await completeTutorial();
      return;
    }

    await saveProgress(newCompletedSteps, currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTutorial = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('tutorial_progress')
        .upsert({
          user_id: user.id,
          tutorial_id: currentTutorial.id,
          current_step: currentTutorial.steps.length,
          completed_steps: currentTutorial.steps.map((_, index) => index),
          is_completed: true,
          completed_at: new Date().toISOString()
        });

      setUserProgress(prev => ({
        ...prev,
        [currentTutorial.id]: {
          currentStep: currentTutorial.steps.length,
          completedSteps: currentTutorial.steps.map((_, index) => index),
          isCompleted: true
        }
      }));

      Modal.success({
        title: '¡Tutorial Completado!',
        content: `Has completado exitosamente el tutorial "${currentTutorial.title}".`,
        icon: <TrophyOutlined style={{ color: '#52c41a' }} />
      });

      setModalVisible(false);
    } catch (error) {
      console.error('Error completing tutorial:', error);
    }
  };

  const saveProgress = async (completedSteps, currentStepIndex) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('tutorial_progress')
        .upsert({
          user_id: user.id,
          tutorial_id: currentTutorial.id,
          current_step: currentStepIndex,
          completed_steps: completedSteps,
          is_completed: false
        });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const getProgressPercentage = (tutorialId) => {
    const progress = userProgress[tutorialId];
    if (!progress) return 0;
    const tutorial = tutorials.find(t => t.id === tutorialId);
    if (!tutorial) return 0;
    return Math.round((progress.completedSteps.length / tutorial.steps.length) * 100);
  };

  const getTutorialStatus = (tutorialId) => {
    const progress = userProgress[tutorialId];
    if (!progress) return 'not_started';
    if (progress.isCompleted) return 'completed';
    if (progress.completedSteps.length > 0) return 'in_progress';
    return 'not_started';
  };

  const renderTutorialCard = (tutorial) => {
    const progress = getProgressPercentage(tutorial.id);
    const status = getTutorialStatus(tutorial.id);
    const progressData = userProgress[tutorial.id];

    return (
      <Card
        key={tutorial.id}
        hoverable
        style={{ marginBottom: '16px' }}
        actions={[
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => startTutorial(tutorial)}
          >
            {status === 'completed' ? 'Repetir' : status === 'in_progress' ? 'Continuar' : 'Iniciar'}
          </Button>
        ]}
      >
        <Card.Meta
          avatar={
            <Avatar
              icon={status === 'completed' ? <TrophyOutlined /> : <BookOutlined />}
              style={{
                backgroundColor: status === 'completed' ? '#52c41a' : '#1890ff'
              }}
            />
          }
          title={
            <Space>
              <Text strong>{tutorial.title}</Text>
              <Tag color={difficultyColors[tutorial.difficulty]}>
                {difficultyLabels[tutorial.difficulty]}
              </Tag>
              {status === 'completed' && (
                <Tag color="green" icon={<CheckCircleOutlined />}>
                  Completado
                </Tag>
              )}
            </Space>
          }
          description={
            <div>
              <Paragraph ellipsis={{ rows: 2 }}>
                {tutorial.description}
              </Paragraph>
              <Space>
                <Text type="secondary">
                  <ClockCircleOutlined /> {tutorial.estimated_time} min
                </Text>
                <Text type="secondary">
                  <UserOutlined /> {tutorial.steps?.length || 0} pasos
                </Text>
              </Space>
              {status === 'in_progress' && (
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary">Progreso: {progress}%</Text>
                  <Progress 
                    percent={progress} 
                    size="small" 
                    style={{ marginTop: '4px' }}
                  />
                </div>
              )}
            </div>
          }
        />
      </Card>
    );
  };

  const renderCurrentStep = () => {
    if (!currentTutorial || !currentTutorial.steps[currentStep]) return null;

    const step = currentTutorial.steps[currentStep];
    const isCompleted = completedSteps.includes(currentStep);

    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <Title level={3}>{step.title}</Title>
          <Paragraph>{step.description}</Paragraph>
        </div>

        {step.content && (
          <div style={{ marginBottom: '24px' }}>
            <div dangerouslySetInnerHTML={{ __html: step.content }} />
          </div>
        )}

        {step.tasks && step.tasks.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <Title level={4}>Tareas:</Title>
            <List
              dataSource={step.tasks}
              renderItem={(task, index) => (
                <List.Item>
                  <Checkbox 
                    checked={isCompleted}
                    disabled
                  >
                    {task}
                  </Checkbox>
                </List.Item>
              )}
            />
          </div>
        )}

        {step.tips && step.tips.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <Title level={4}>Consejos:</Title>
            <List
              dataSource={step.tips}
              renderItem={(tip) => (
                <List.Item>
                  <Text type="secondary">ðŸ’¡ {tip}</Text>
                </List.Item>
              )}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <PlayCircleOutlined style={{ marginRight: '8px' }} />
          Tutoriales Interactivos
        </Title>
        <Text type="secondary">
          Aprende a usar el sistema paso a paso con gu­as interactivas
        </Text>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' }}>
        {tutorials.map(renderTutorialCard)}
      </div>

      {/* Modal del tutorial */}
      <Modal
        title={
          <Space>
            <PlayCircleOutlined />
            <span>{currentTutorial?.title}</span>
            <Tag color={difficultyColors[currentTutorial?.difficulty]}>
              {difficultyLabels[currentTutorial?.difficulty]}
            </Tag>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={
          <Space>
            <Button onClick={prevStep} disabled={currentStep === 0}>
              Anterior
            </Button>
            <Button
              type="primary"
              onClick={nextStep}
              disabled={currentStep >= (currentTutorial?.steps?.length || 0) - 1}
            >
              {currentStep >= (currentTutorial?.steps?.length || 0) - 1 ? 'Completar' : 'Siguiente'}
            </Button>
          </Space>
        }
      >
        {currentTutorial && (
          <div>
            <Steps
              current={currentStep}
              items={currentTutorial.steps.map((step, index) => ({
                title: step.title,
                status: completedSteps.includes(index) ? 'finish' : 
                       index === currentStep ? 'process' : 'wait'
              }))}
              style={{ marginBottom: '24px' }}
            />

            <div style={{ minHeight: '400px' }}>
              {renderCurrentStep()}
            </div>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <Text type="secondary">
                Paso {currentStep + 1} de {currentTutorial.steps.length}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InteractiveTutorials;


