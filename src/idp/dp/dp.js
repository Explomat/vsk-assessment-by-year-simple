import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { Spin, List, Button, Modal, Input, PageHeader, Row, Col, Steps, Card, Tag } from 'antd';
import { DownloadOutlined, ArrowRightOutlined, CheckOutlined } from '@ant-design/icons';
import DpMeta from '../meta';
import TaskList from './taskList';
import TaskForm from './taskForm';
import ThemeList from './themeList';
import { renderDate } from '../../utils/date';
import { connect } from 'react-redux';
import { getDp, changeStep, addTask, updateTask, removeTask, updateThemes, saveIdp } from './dpActions';
import { createBaseUrl } from '../../utils/request';
import './index.css';
import 'antd/es/table/style/index.css';
import 'antd/dist/antd.css';
import '../App.css';

const UserDescription = ({ ...props }) => (
	<Col>
		<div className='description'>
			<div className='term'>{props.children}</div>
			<a className='detail' target='__blank' href={`/view_doc.html?mode=collaborator&object_id=${props.id}`}>{props.fullname}</a>
		</div>
	</Col>
);

class Dp extends Component {

	constructor(props) {
		super(props);

		this.state = {
			isShowModalTask: false,
			isShowModalTheme: false,
			isShowModalComment: false,
			comment: ''
		}

		this.currentCompetenceIdForAdd = null;

		this.currentAction = null;
		this.handleToggleTaskModal = this.handleToggleTaskModal.bind(this);
		this.handleAddTask = this.handleAddTask.bind(this);
		this.handleToggleThemeModal = this.handleToggleThemeModal.bind(this);
		this.handleAddTheme = this.handleAddTheme.bind(this);
		this.handleChangeStep = this.handleChangeStep.bind(this);
		this.handeAction = this.handeAction.bind(this);
		this.handleToggleCommentModal = this.handleToggleCommentModal.bind(this);
		this.handleChangeComment = this.handleChangeComment.bind(this);
		this.handleUpdate = this.handleUpdate.bind(this);
	}

	componentDidMount() {
		const { match, getDp, user } = this.props;
		const userId = user ? user.id : null;
		getDp(match.params.id, userId);
	}

	handleUpdate() {
		const { match, saveIdp, card, user } = this.props;
		const userId = user ? user.id : null;
		saveIdp(match.params.id, card.development_plan_id, userId);

		this.handleToggleThemeModal();
	}

	handleToggleThemeModal() {
		this.setState({
			isShowModalTheme: !this.state.isShowModalTheme
		});
	}

	handleToggleTaskModal(competenceId) {
		this.currentCompetenceIdForAdd = competenceId;
		this.setState({
			isShowModalTask: !this.state.isShowModalTask
		});
	}

	handleToggleCommentModal() {
		this.setState({
			isShowModalComment: !this.state.isShowModalComment,
			comment: ''
		});
	}

	handleChangeComment({ target: { value } }) {
		this.setState({ comment: value });
	}

	handeAction(action) {
		const { changeStep, match } = this.props;

		if (action.allow_additional_data === 'true'){
			this.currentAction = action;
			this.handleToggleCommentModal();
		} else {
			changeStep(match.params.id, action.code);
		}
	}

	handleChangeStep(isComment) {
		const { changeStep, match } = this.props;
		const comment = isComment ? this.state.comment : null;
		changeStep(match.params.id, this.currentAction.code, comment);
		this.handleToggleCommentModal();
	}

	handleAddTask(task) {
		const { addTask, match, card } = this.props;
		addTask(task, match.params.id, card.development_plan_id, this.currentCompetenceIdForAdd);
		this.handleToggleTaskModal();
	}

	handleAddTheme(theme) {
		const { addTheme } = this.props;
		addTheme(theme);
		this.handleToggleThemeModal();
	}

	renderHeader() {
		const { card, history  } = this.props;
		const cdate = () => 'с ' + renderDate(card.create_date) + ' ' + (card.plan_date ? `по ${renderDate(card.plan_date)}` : '');
		const rurl = createBaseUrl('idp', 'Report', { cr_id: card.id });

		return (	
			<PageHeader
				onBack={history.goBack}
				title={<span>{card.person_fullname}</span>}
				extra={[
					<Tag key='date' color='green'>{cdate()}</Tag>,
					<div key='status' className='detail'>Статус: <span className='dp__status'>{card.state_name}</span></div>,
					<a style={{ 'paddingTop': '12px', display: 'block' }} key='report' href={rurl} className='term'>Скачать отчет <DownloadOutlined /></a>
				]}
			>
				<div className='wrap'>
					<div className='content padding'>
						{card.managers && card.managers.map(t => {
							return (
								<Row key={t.id} style={{ width: '70%' }}>
									<UserDescription {...t}>{t.expert_person_type_name}</UserDescription>
								</Row>
							);
						})}
						<Row style={{ width: '70%' }}>
							<Col>
								<div className='description'>
									<div className='term'>Текущий этап</div>
									<div className='detail dp__current-step'>{card.main_step_name} / {card.step_name}</div>
								</div>
							</Col>
						</Row>
					</div>
				</div>
			</PageHeader>
		);
	}

	renderMainSteps(){
		const { card } = this.props;
		const curStepIndex = card.main_steps.findIndex(s => s.id === card.main_step_id);
		return (
			<div className='dp__steps'>
				<Steps progressDot current={curStepIndex}>
					{card.main_steps &&
						card.main_steps.map((s, index) => (
							<Steps.Step
								key={s.id}
								title={
									<span>
										<span className='dp__date'>{renderDate(s.date)}</span>
										{s.is_approved ? <CheckOutlined className='adaptation__date-check' /> : null}
									</span>
								}
								description={s.name}
							/>)
						)}
				</Steps>
			</div>
		);
	}

	renderHistory(){
		const { card } = this.props;

		return (
			<Card className='dp__history' title='История этапов'>
				<List>
					{card.main_flows.map(t => {
						return (
							<List.Item
								key={t.id}
							>
								 <List.Item.Meta
								 	title={<span>
								 		<span className='dp__date'>{renderDate(t.created_date)}</span>
								 		<span className='dp__history-step'>{t.idp_main_step_name} / {t.idp_step_name}</span>
								 	</span>}
								 />
								 <div>{t.current_collaborator_fullname} <ArrowRightOutlined /> {t.next_collaborator_fullname}</div>
								 {t.comment && (
								 	<div className='dp__history-data'>
								 		Комментарий: 
								 		<div className='dp__history-comment'>{t.comment}</div>
								 	</div>
								 )}
							</List.Item>
						)
					})}
				</List>
			</Card>
		);
	}

	render() {
		const { match, card, ui, updateTask, removeTask } = this.props;
		const { isShowModalTask, isShowModalTheme, isShowModalComment, comment } = this.state;

		return (
			<Spin spinning={ui.isLoading}>
				<div className='dp'>
					{ /*this.renderHeader()*/ }
					<div className='dp__body'>
						{this.renderMainSteps()}
						<div className='dp__competence-and-themes-container'>
							<div className='dp_header'>
								<div className='dp__title'>Обязательные обучения для развития компетенций</div>
									{card.meta.allow_add_themes ? (
										<Button className='dp__themes-add' type='primary' ghost onClick={this.handleToggleThemeModal}>
											Редактировать
										</Button>
									) : null}
								</div>
								<ThemeList competences={card.competences} />
						</div>
						{card.meta.allow_view_tasks && <div className='dp__body-competence-tasks'>
							<div className='dp__title'>Развивающиее задачи</div>
							{card.competences.map(c => 
								<Card
									key={c.id}
									className='dp__tasks'
									title={c.name}
									extra={
										card.meta.allow_add_tasks ? (
											<Button className='dp__tasks-add' type='primary' ghost onClick={() => this.handleToggleTaskModal(c.id)}>
												Добавить задачу
											</Button>
										) : null
									}
								>
									<TaskList
										competenceId = {c.id}
										tasks={c.tasks}
										updateTask={updateTask}
										removeTask={removeTask}
										meta={card.meta}
										task_types={card.task_types}
										assessment_appraise_id={match.params.id}
										development_plan_id={card.development_plan_id}
									/>
								</Card>
							)}
							<div className='dp__body-competence-tasks-actions'>
								{card.meta.actions && card.meta.actions.map(a => {
									let tasksLen = 0;
									card.competences.forEach(c => {
										tasksLen += c.tasks.length;
									});

									return (
										<Button
												key={a.code}
												disabled={tasksLen === 0}
												className='dp__tasks-actions'
												type='primary'
												onClick={() => this.handeAction(a)}
										>
											{a.name}
										</Button>
									);
								})}
							</div>
						</div>}
						{isShowModalTheme &&
							<Modal
								visible={true}
								width={1000}
								title='Редактирование'
								cancelText='Отмена'
								okText='Сохранить'
								onCancel={this.handleToggleThemeModal}
								onOk={this.handleUpdate}
							>
								<DpMeta dpId={card.development_plan_id}/>
							</Modal>
						}
						{isShowModalTask && <TaskForm
							title='Новая задача'
							onCommit={this.handleAddTask}
							onCancel={this.handleToggleTaskModal}
							task_types={card.task_types}
							meta={card.meta}
						/>}
						<Modal
							title='Сообщение'
							visible={isShowModalComment}
							onOk={() => this.handleChangeStep(true)}
							onCancel={this.handleToggleCommentModal}
							footer={[
								<Button key='submit' onClick={() => this.handleChangeStep(true)}>
									Ok
								</Button>,
								<Button key='cancel' onClick={this.handleToggleCommentModal}>
									Отмена
								</Button>,
								<Button key='submit_wthout_comment' onClick={this.handleChangeStep}>
									Отправить без комментария
								</Button>
							]}
						>
							<Input.TextArea placeholder='Описание' value={comment} autosize={{ minRows: 3}} onChange={this.handleChangeComment}/>
						</Modal>
					</div>
					<div className='dp__footer'>
						{this.renderHistory()}
					</div>
				</div>
			</Spin>
		);
	}
}

function mapStateToProps(state){
	const { idp } = state;
	return {
		card: idp.dp.card,
		ui: idp.dp.ui
	}
}

export default withRouter(connect(mapStateToProps, { getDp, saveIdp, changeStep, addTask, updateTask, removeTask, updateThemes })(Dp));