import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { Card, Checkbox, Modal, Button, List, Avatar } from 'antd';
import { ContactsOutlined, CheckOutlined } from '@ant-design/icons';
import { getCompetencesAndThemes, onCompetenceChecked, onThemeChecked } from './metaActions';
import './meta.css';

class Meta extends Component {

	constructor(props){
		super(props);

		this.handleShowConfirm = this.handleShowConfirm.bind(this);
		this.handleCreateDp = this.handleCreateDp.bind(this);
		this.handleChecked = this.handleChecked.bind(this);
		this.handleNextStep = this.handleNextStep.bind(this);
		this.handleCheckedTheme = this.handleCheckedTheme.bind(this);

		this.state = {
			isShowConfirm: false,
			steps: {
				1: 1,
				2: 2,
				3: 3
			},
			currentStep: 1
		}
	}

	componentDidMount(){
		const { match, getCompetencesAndThemes } = this.props;
		getCompetencesAndThemes(match.params.id);
	}

	handleChecked(e, id) {
		this.props.onCompetenceChecked(e.target.checked, id);
	}

	handleShowConfirm() {
		this.setState({
			isShowConfirm: !this.state.isShowConfirm
		});
	}

	handleCreateDp() {
		const { match, loadData } = this.props;
		loadData(match.params.id);

		this.handleShowConfirm();
	}

	handleNextStep() {
		this.setState({
			currentStep: this.state.currentStep + 1
		});
	}

	handleCheckedTheme(e, competenceId, themeId) {
		this.props.onThemeChecked(e.target.checked, competenceId, themeId);
	}

	render() {
		const { isShowConfirm } = this.state;
		const { meta, match } = this.props;
		const { currentStep } = this.state;

		if (meta.ui.isLoading) {
			return null;
		}

		return (
			<Card className='dp-meta' title={`${currentStep === 1 ? 'Компетенции' : 'Темы обучений для развития компетенций'}`}>
				{currentStep === 1 && <div className='dp-meta__description'>Выберите 1 или 2 компетенции для развития. При выборе двух компетенций - вам нужно будет выбрать по одному обязательному обучению для каждой, при выборе одно - два обучения для развития этой компетенции.</div>}
				{currentStep === 2 && <div className='dp-meta__description'>Выберите темы для развития</div>} 
				<List
					className='dp-list'
					itemLayout='horizontal'
				>
					{meta.competences.map(item => {
						const scale = meta.scales.find(s => s.scale === item.mark_text);
						const className = scale ? 'dp-meta__label--active': '';

						return (
							<div key={item.id}>
								{currentStep === 1 &&
									<List.Item className={`dp-meta-competence dp-meta-competence--1-step`}>
										<List.Item.Meta
											avatar={<Checkbox checked={item.checked} onChange={e => this.handleChecked(e, item.id)}/>}
											title={
												<div>
										 			<span style={{
														backgroundColor: scale && scale.color,
														borderColor: scale && scale.color
													}}
													className={`dp-meta__label ${className}`}>
														{item.mark_text}
													</span>
													<span style={{color: '#1890ff'}}>{item.name}</span>
										 		</div>
									 		}
											description={item.common_comment}
										/>
									</List.Item>
								}

								{currentStep === 2 &&
									item.checked && <div>
										<List.Item className={`dp-meta-competence dp-meta-competence--2-step`}>
											<List.Item.Meta
												title={
													<div>
											 			<span style={{
															backgroundColor: scale && scale.color,
															borderColor: scale && scale.color
														}}
														className={`dp-meta__label ${className}`}>
															{item.mark_text}
														</span>
														<span style={{color: '#1890ff'}}>{item.name}</span>
											 		</div>
										 		}
											/>
										</List.Item>
										<List className='dp-list-2-step' itemLayout='horizontal'>
											{item.competence_themes.map(t => {
												return (
													<List.Item key={t.id} className='dp-list-2-meta-theme'>
														<List.Item.Meta
															avatar={<Checkbox checked={t.checked} onChange={e => this.handleCheckedTheme(e, item.id, t.id)}/>}
															title={t.name}
														/>
													</List.Item>
												)
											})}
										</List>
									</div>
								}
							</div>
						)
					})}
				</List>
				<div className='clearfix' />
				{currentStep < 4 && <Button className='clearfix' type='primary' style={{float: 'right'}} onClick={this.handleNextStep} disabled={!meta.hasChecked}>Далее</Button>}
				{currentStep === 4 && <Button className='clearfix' type='primary' style={{float: 'right'}} onClick={this.handleShowConfirm} disabled={!meta.hasChecked}>Сохранить</Button>}
				<Modal
					visible={isShowConfirm}
					title='Подтвердите действие'
					cancelText='Отмена'
					okText='Ok'
					onCancel={this.handleShowConfirm}
					onOk={this.handleCreateDp}
				>
					<span className='content'>
						<p>{`Вы действительно хотите выбрать "${meta.selectedNode && meta.selectedNode.name}" ?`}</p>
						<p>Будьте внимательны, эти данные нельзя будет изменить.</p>
					</span>
				</Modal>
			</Card>
		);
	}
}

function mapStateToProps(state){
	return {
		meta: state.idp.meta
	}
}

export default withRouter(connect(mapStateToProps, { getCompetencesAndThemes, onCompetenceChecked, onThemeChecked })(Meta));