import { Animated, Dimensions, PanResponder, StyleSheet, TouchableWithoutFeedback } from "react-native";
import React, { Component } from "react";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default class component extends Component {
  position = null;

  constructor(props) {
    super(props);

    this.state = this.computeState(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.initialDrawerSize != this.props.initialDrawerSize) {
        this.setState(this.computeState(nextProps));
    }
  }

  computeState(props) {
    const initialUsedSpace = Math.abs(props.initialDrawerSize);
    const initialDrawerSize = SCREEN_HEIGHT * (1 - initialUsedSpace);

    var finalDrawerSize = this.props.finalDrawerHeight
      ? this.props.finalDrawerHeight
      : 0;

    return {
      touched: false,
      position: new Animated.Value(initialDrawerSize),
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
    positionY,
    initialPositon,
    id,
    finalPosition
  ) => {
    var isGoingToUp = velocityY < 0 ? true : false;
    var speed = Math.abs(velocityY);
    var currentPosition = Math.abs(positionY / SCREEN_HEIGHT);
    var endPosition = isGoingToUp ? finalPosition : initialPositon;

    if (this.position) {
      this.position.removeAllListeners();
    }

    var position = (this.position = new Animated.Value(positionY));

    Animated.spring(position, {
      toValue: endPosition,
      bounciness: isGoingToUp ? 8 : 0,
      // overshootClamping: true,
      velocity: velocityY,
      useNativeDriver: true
    }).start();

    position.addListener(position => {
      if (!this.center) return;
      this.onUpdatePosition(position.value);
    });
  };

  onUpdatePosition(position) {
    this.state.position.setValue(position);

    const { finalPosition, initialUsedSpace, initialPositon } = this.state;

    if (this.props.onUpdatePosition) {
      this.props.onUpdatePosition(position, finalPosition, initialPositon, initialUsedSpace);
    }
  }

  componentWillMount() {
    this._panGesture = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return (
          this.isAValidMovement(gestureState.dx, gestureState.dy) &&
          this.state.touched === true
        );
      },
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

    var currentValue = Math.abs(gestureState.moveY / SCREEN_HEIGHT);
    var isGoingToUp = gestureState.vy < 0;

    // Here, I'm subtracting %5 of screen size from edge drawer position to be closer as possible to finger location when dragging the drawer view
    var position = gestureState.moveY - SCREEN_HEIGHT * 0.05;

    // Send to callback function the current drawer position when drag down the drawer view component
    this.onUpdatePosition(position);
  }

  moveFinished(gestureState) {
    var isGoingToUp = gestureState.vy < 0;

    if (!this.center) return;

    this.startAnimation(
      gestureState.vy,
      gestureState.moveY,
      this.state.initialPositon,
      gestureState.stateId,
      this.state.finalPosition
    );

    if (this.props.onRelease) {
      this.props.onRelease(isGoingToUp);
    }
  }

  render() {
    var drawerView = this.props.renderDrawerView
      ? this.props.renderDrawerView()
      : null;
    
      var initDrawerView = this.props.renderInitDrawerView
      ? this.props.renderInitDrawerView()
      : null;

    var drawerPosition = {
      top: this.state.position
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
