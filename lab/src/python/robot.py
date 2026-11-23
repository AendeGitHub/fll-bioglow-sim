"""USTEM Lab robot: a two-wheeled driving base with a colour sensor and a distance sensor.

    from robot import *

    forward(30)        # drive 30 cm forward
    turn_right(90)     # turn 90 degrees clockwise on the spot
    if distance() < 10:
        stop()
"""

import _sim

__all__ = [
    "forward", "backward", "turn_right", "turn_left", "set_speed", "drive", "stop", "wait",
    "color", "reflection", "distance", "heading", "timer", "say", "beep", "light",
]


def forward(cm):
    """Drive straight `cm` centimetres, then stop."""
    _sim.forward(float(cm))


def backward(cm):
    """Drive back `cm` centimetres, then stop."""
    _sim.backward(float(cm))


def turn_right(degrees):
    """Turn clockwise on the spot."""
    _sim.turn_right(float(degrees))


def turn_left(degrees):
    """Turn anticlockwise on the spot."""
    _sim.turn_left(float(degrees))


def set_speed(percent):
    """Speed for forward/backward/turn, 5 to 100 percent (starts at 50)."""
    _sim.set_speed(float(percent))


def drive(left, right):
    """Start the left and right motors (-100 to 100 percent) and carry on with the program."""
    _sim.drive(float(left), float(right))


def stop():
    """Stop both motors."""
    _sim.stop()


def wait(seconds):
    """Wait; motors keep doing what they were doing."""
    _sim.wait(float(seconds))


def color():
    """Colour under the colour sensor: 'white', 'black', 'red', 'green', 'blue' or 'yellow'."""
    return str(_sim.color())


def reflection():
    """Reflected light under the colour sensor, 0 (black) to 100 (white)."""
    return int(_sim.reflection())


def distance():
    """Centimetres from the front of the robot to the nearest obstacle (200 if nothing)."""
    return float(_sim.distance())


def heading():
    """Degrees turned clockwise since the start (gyro)."""
    return float(_sim.heading())


def timer():
    """Seconds since the program started."""
    return float(_sim.timer())


def say(*values):
    """Show a message (same as print)."""
    _sim.say(" ".join(str(v) for v in values))


def beep():
    _sim.beep()


def light(name):
    """Hub light: 'red', 'green', 'blue', 'yellow', 'white' or 'off'."""
    _sim.light(str(name))
