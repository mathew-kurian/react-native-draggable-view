import { Animated, Dimensions, PanResponder, StyleSheet, TouchableWithoutFeedback } from "react-native";
import React, { Component } from "react";
import shouldComponentUpdate from 'react-native-calendars/src/calendar/updater';

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default class component extends Component {
  state = {};
  center = null;

  constructor(props) {
    super(props);

    this.state = this.computeState(this.props);
  }

  componentWillUnmount() {
    this.state.position.removeAllListeners();
  }

  componentWillReceiveProps(nextProps) {
    if (!!nextProps.visible !== !!this.props.visible) {
      if (nextProps.visible) {
        this.startAnimation(-2.85, this.state.initialPositon);
      } else {
        this.startAnimation(2.85, SCREEN_HEIGHT);
      }
    }
  }

  computeState(props) {
    const initialUsedSpace = Math.abs(props.initialDrawerSize);
    const initialDrawerSize = SCREEN_HEIGHT * (1 - initialUsedSpace);

    const finalDrawerSize = props.finalDrawerHeight
      ? props.finalDrawerHeight
      : 0;

    return {
      touched: false,
      position: new Animated.Value(props.visible ? initialDrawerSize : SCREEN_HEIGHT),
      initialPositon: initialDrawerSize,
      finalPosition: finalDrawerSize,
      initialUsedSpace: initialUsedSpace
    };
  }

  isAValidMovement = (distanceX, distanceY) => {
    const moveTravelledFarEnough =
      Math.abs(distanceY) > Math.abs(distanceX) && Math.abs(distanceY) > 2;

    return moveTravelledFarEnough;
  };

  startAnimation = (
    velocityY,
    endPosition
  ) => {
    // alert(JSON.stringify({velocityY, positionY, initialPositon, finalPosition}));
    this.state.position.stopAnimation();

    Animated.spring(this.state.position, {
      toValue: endPosition,
      bounciness: 0,
      speed: 12,
      velocity: velocityY,
      useNativeDriver: true
    }).start();

    this.state.position.removeAllListeners();

    this.state.position.addListener(position => {
      if (!this.center) return;
      this.onUpdatePosition(position.value);
    });
  };

  onUpdatePosition(position) {
    const { finalPosition, initialUsedSpace, initialPositon } = this.state;

    if (this.props.onUpdatePosition) {
      this.props.onUpdatePosition(position, finalPosition, initialPositon, initialUsedSpace);
    }
  }

  componentWillMount() {
    this._panGesture = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => this.state.touched === true,
      onPanResponderMove: (evt, gestureState) => {
        this.moveDrawerView(gestureState);
      },
      onPanResponderRelease: (evt, gestureState) => {
        this.moveFinished(gestureState);
      }
    });
  }

  moveDrawerView(gestureState) {
    if (!this.center) return;

    // Here, I'm subtracting %5 of screen size from edge drawer position to be closer as possible to finger location when dragging the drawer view
    var position = gestureState.moveY - SCREEN_HEIGHT * 0.035;

    this.state.position.setValue(position);

    // Send to callback function the current drawer position when drag down the drawer view component
    this.onUpdatePosition(position);
  }

  moveFinished(gestureState) {
    var isGoingToUp = gestureState.vy < 0;

    if (!this.center) return;

    this.startAnimation(
      gestureState.vy,
      gestureState.vy > 0 ? this.state.initialPositon : this.state.finalPosition
    );

    if (this.props.onRelease) {
      this.props.onRelease(isGoingToUp);
    }
  }

  render() {
    var drawerView = this.props.renderDrawerView
      ? this.props.renderDrawerView()
      : this.props.drawerView;

    var initDrawerView = this.props.renderInitDrawerView
      ? this.props.renderInitDrawerView()
      : this.props.initDrawerView;

    var drawerPosition = {
      transform: [{translateY: this.state.position }]
    };

    return (
      <Animated.View
        style={[
          drawerPosition,
          styles.drawer
        ]}
        ref={center => (this.center = center)}
        {...this._panGesture.panHandlers}
      >
        <TouchableWithoutFeedback
          onPressIn={() => {
            this.setState({ touched: true });
          }}
          onPressOut={() => {
            this.setState({ touched: false });
          }}
        >
          {initDrawerView}
        </TouchableWithoutFeedback>
        {drawerView}
      </Animated.View>
    );
  }
}

var styles = StyleSheet.create({
  drawer: {
    flex: 1
  },
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0
  }
});
