import {
  AlertIOS,
  Animated,
  AppRegistry,
  Dimensions,
  Easing,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import React, { Component } from 'react';
const SCREEN_HEIGHT = Dimensions.get('window').height;
export default class component extends Component {
  position = null;
  
  constructor(props) {
    super(props)
    // naming it initialX clearly indicates that the only purpose
    // of the passed down prop is to initialize something internally
    const initialUsedSpace = Math.abs(this.props.initialDrawerSize);
    const initialDrawerSize = (SCREEN_HEIGHT * (1 - initialUsedSpace));


    var finalDrawerSize = this.props.finalDrawerHeight ? this.props.finalDrawerHeight : 0;

    this.state = {
      touched: 'FALSE',
      initialPositon: initialDrawerSize,
      finalPosition: finalDrawerSize,
      initialUsedSpace: initialUsedSpace,
    };
  }


  isAValidMovement = (distanceX, distanceY) => {
    const moveTravelledFarEnough = Math.abs(distanceY) > Math.abs(distanceX) && Math.abs(distanceY) > 2;
    
    return moveTravelledFarEnough;
  }


  startAnimation = (velocityY, positionY, initialPositon, id, finalPosition) => {
    var isGoingToUp = (velocityY < 0) ? true : false;
    var speed = Math.abs(velocityY);
    var currentPosition = Math.abs(positionY / SCREEN_HEIGHT);
    var endPosition = isGoingToUp ? finalPosition : initialPositon;

    if (this.position) {
      this.position.removeAllListeners();
    }
    
    var position = this.position = new Animated.Value(positionY);

    Animated.spring(position, {
      toValue: endPosition,
      bounciness: isGoingToUp ? 8 : 0,
      velocity: velocityY
    }).start();

    position.addListener((position) => {
      if (!this.center) return;
      this.onUpdatePosition(position.value);
    });
  }

  onUpdatePosition(position) {
    this.state.position.setValue(position);
    this._previousTop = position;

    const { initialPosition, finalPosition } = this.state

    if (initialPosition === position) {
      this.props.onInitialPositionReached && this.props.onInitialPositionReached();
    }
    
    if (this.props.onUpdatePosition) {
      this.props.onUpdatePosition(position, initialPosition, finalPosition);
    }
  }

  componentWillMount() {
    this._panGesture = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return this.isAValidMovement(gestureState.dx, gestureState.dy) && this.state.touched == 'TRUE';
      },
      onPanResponderMove: (evt, gestureState) => {
        this.moveDrawerView(gestureState);
      },
      onPanResponderRelease: (evt, gestureState) => {
        this.moveFinished(gestureState);
      },
    });
  }


  moveDrawerView(gestureState) {
    if (!this.center) return;
    
    var currentValue = Math.abs(gestureState.moveY / SCREEN_HEIGHT);
    var isGoingToUp = (gestureState.vy < 0);
   
    // Here, I'm subtracting %5 of screen size from edge drawer position to be closer as possible to finger location when dragging the drawer view
    var position = gestureState.moveY - SCREEN_HEIGHT * 0.05;
   
    // Send to callback function the current drawer position when drag down the drawer view component
    this.onUpdatePosition(position);
  }

  moveFinished(gestureState) {
    var isGoingToUp = (gestureState.vy < 0);
   
    if (!this.center) return;
   
    this.startAnimation(gestureState.vy, gestureState.moveY, this.state.initialPositon, gestureState.stateId, this.state.finalPosition);
    
    if (this.props.onRelease) {
      this.props.onRelease(isGoingToUp);
    }
  }

  render() {
    var drawerView = this.props.renderDrawerView ? this.props.renderDrawerView() : null;
    var initDrawerView = this.props.renderInitDrawerView ? this.props.renderInitDrawerView() : null;
   
    return (
      <Animated.View
          style={[styles.drawer,
            { backgroundColor: this.props.drawerBg ? this.props.drawerBg : 'white' }]}
          ref={(center) => this.center = center}
          {...this._panGesture.panHandlers}
        >
          <TouchableWithoutFeedback
            onPressIn={() => {
              this.setState({ touched: 'TRUE' });
            }}
            onPressOut={() => {
              this.setState({ touched: 'FALSE' });
            }}>
            {initDrawerView}
          </TouchableWithoutFeedback>
          {drawerView}
        </Animated.View>
    );
  }
};


var styles = StyleSheet.create({
  drawer: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});
