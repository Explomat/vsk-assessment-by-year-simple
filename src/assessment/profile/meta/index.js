import React, { Component } from 'react';
import Item from './Item';
import { withRouter, Redirect } from 'react-router';
import { Card, Button, Confirm } from 'semantic-ui-react';
import { getMeta, onChecked, changeTrain } from './metaActions';
import { connect } from 'react-redux';

import './metaStyle.css';

class Meta extends Component {

	constructor(props) {
		super(props);

		this.handleCancelTrain = this.handleCancelTrain.bind(this);
		this.handleConfirmTrain = this.handleConfirmTrain.bind(this);
		this.renderChannels = this.renderChannels.bind(this);
		this.handleShowConfirm = this.handleShowConfirm.bind(this);
		this.handleCreateAssessment = this.handleCreateAssessment.bind(this);

		this.state = {
			isShowConfirm: false
		}
	}

	componentDidMount() {
		const { match, loadData } = this.props;
		loadData(match.params.id);
	}

	handleCancelTrain() {
		const { match, changeTrain, loadData } = this.props;
		changeTrain(false);
		loadData(match.params.id);
	}

	handleConfirmTrain() {
		const { match, changeTrain, loadData } = this.props;
		changeTrain(true);
		loadData(match.params.id);
	}

	handleCreateAssessment() {
		const { match, loadData } = this.props;
		loadData(match.params.id);

		this.handleShowConfirm();
	}

	handleShowConfirm() {
		this.setState({
			isShowConfirm: !this.state.isShowConfirm
		});
	}

	renderChannels(channels) {
		const { onChecked } = this.props;

		return channels.map(c =>
			<Item onChange={onChecked} key={c.id} {...c}>
				{c.children.length > 0 ? this.renderChannels(c.children) : null}
			</Item>
		);
	}

	render() {
		const { isShowConfirm } = this.state;
		const { ui, meta, match } = this.props;

		if (ui.isLoading) {
			return null;
		}

		if (meta.isNeedAskTrain && !meta.isTrain) {
			return (
				 <Confirm
					open
					content='Относитесь ли вы к стратегическому поезду?'
					cancelButton='Нет'
					confirmButton='Да'
					onCancel={this.handleCancelTrain}
					onConfirm={this.handleConfirmTrain}
				/>
			);
		}

		if (!meta.hasPa && meta.shouldHasPa) {
			return (
				<div>
					<Card fluid className='assessment-meta'>
						<Card.Content header='Выберите, к какому каналу продаж относится ваша дирекция' />
						<Card.Content>
							<ul className='assessment-meta__root-ul'>
								{this.renderChannels(meta.channels)}
							</ul>
						</Card.Content>
						<Card.Content extra>
							 <Button style={{float: 'right'}} onClick={this.handleShowConfirm} primary disabled={!meta.hasChecked}>Далее</Button>
						</Card.Content>
					</Card>
					<Confirm
						open={isShowConfirm}
						header='Подтвердите действие'
						content={
							<span className='content'>
								<p>{`Вы действительно хотите выбрать "${meta.selectedNode && meta.selectedNode.name}" ?`}</p>
								<p>Будьте внимательны, эти данные нельзя будет изменить.</p>
							</span>
						}
						cancelButton='Отмена'
						confirmButton='Ok'
						onCancel={this.handleShowConfirm}
						onConfirm={this.handleCreateAssessment}
					/>
				</div>
			);
		} else {
			return <Redirect to={`/profile/${match.params.id}`} />
		}
	}
}


function mapStateToProps(state) {
	return {
		meta: state.assessment.meta,
		ui: state.assessment.ui
	}
}

function mapDispatchProps(dispatch, ownProps) {
	return {
		loadData: (id) => dispatch(getMeta(id)),
		onChecked: (id, isChecked) => dispatch(onChecked(id, isChecked)),
		changeTrain: isTrain => dispatch(changeTrain(isTrain))
	}
}

export default withRouter(connect(mapStateToProps, mapDispatchProps)(Meta));