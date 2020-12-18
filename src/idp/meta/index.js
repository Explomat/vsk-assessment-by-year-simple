import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { Card, PageHeader, Checkbox, Confirm, Modal, Button } from 'antd';
import { UserOutlined, CheckOutlined } from '@ant-design/icons';
import { getCompetencesAndThemes, onChecked } from './metaActions';
import './meta.css';

class Meta extends Component {

	constructor(props){
		super(props);

		//this.renderChannels = this.renderChannels.bind(this);
		this.handleShowConfirm = this.handleShowConfirm.bind(this);
		this.handleCreateDp = this.handleCreateDp.bind(this);
		this.handleChecked = this.handleChecked.bind(this);

		this.state = {
			isShowConfirm: false
		}
	}

	componentDidMount(){
		const { match, getCompetencesAndThemes } = this.props;
		getCompetencesAndThemes(match.params.id);
	}

	handleChecked(e, id) {
		const { onChecked } = this.props;
		onChecked(id, e.target.checked);
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

	render() {
		const { isShowConfirm } = this.state;
		const { meta, match } = this.props;

		if (meta.ui.isLoading) {
			return null;
		}

		return (
			<div>
				<h3>Выберите компетенции для развития</h3>
				{meta.competences.map(c => {
					return (
						<Card
							key={c.id}
							title={c.name}
							className='dp-meta-competence'
							extra={<Checkbox checked={c.checked} onChange={e => this.handleChecked(e, c.id)}/>}
						>
							<div className='dp-meta__labels'>
								{meta.scales.map(s => {
									const isScale = s.scale === c.mark_text;
									const className = isScale ? 'dp-meta__label--active': '';

									return (
										<span
											key={s.id}
											style={{
												backgroundColor: s.color,
												borderColor: s.color
											}}
											className={`dp-meta__label ${className}`}
										>
											{isScale ? <CheckOutlined className='dp-meta__label-checked-icon'/> : null}
											{s.scale}
										</span>
									)
								})}
							</div>
						</Card>
					);
				})}
				<div className='clearfix' />
				<Button className='clearfix' type='primary	' style={{float: 'right'}} onClick={this.handleShowConfirm} disabled={!meta.hasChecked}>Сохранить</Button>
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
			</div>
		);
	}
}

function mapStateToProps(state){
	return {
		meta: state.idp.meta
	}
}

/*function mapDispatchProps(dispatch, ownProps) {
	return {
		loadData: (id) => dispatch(getMeta(id)),
		onChecked: (id, isChecked) => dispatch(onChecked(id, isChecked)),
		changeTrain: isTrain => dispatch(changeTrain(isTrain))
	}
}*/

export default withRouter(connect(mapStateToProps, { getCompetencesAndThemes, onChecked })(Meta));