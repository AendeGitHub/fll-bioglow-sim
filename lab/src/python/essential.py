"""USTEM Lab: LEGO SPIKE Essential hub with ports A and B.

    from essential import *

    motor_run('A', 1)               # one rotation clockwise
    motor_run('A', -90, 'degrees')  # 90 degrees anticlockwise
    show_image('smile', 'yellow')   # on the 3x3 light matrix
    if color() == 'green':
        hub_light('green')
"""

import _bench

__all__ = [
    "motor_run", "motor_start", "motor_stop", "motor_speed", "motor_go_to", "motor_position",
    "show_image", "set_pixel", "fill", "clear", "color", "hub_light", "beep", "wait", "timer", "say",
]


def motor_run(port, amount, unit="rotations"):
    """Run a motor for `amount` rotations, degrees or seconds. Negative = anticlockwise."""
    if unit not in ("rotations", "degrees", "seconds"):
        raise ValueError("unit must be 'rotations', 'degrees' or 'seconds'")
    _bench.run_for(str(port), float(amount), unit)


def motor_start(port, direction=1):
    """Start a motor and carry on with the program. direction: 1 clockwise, -1 anticlockwise."""
    _bench.start(str(port), int(direction))


def motor_stop(port):
    _bench.stop_motor(str(port))


def motor_speed(port, percent):
    """Speed for this motor, 5 to 100 percent (starts at 50)."""
    _bench.set_speed(str(port), float(percent))


def motor_go_to(port, position):
    """Turn to a position 0-359 by the shortest way."""
    _bench.go_to(str(port), float(position))


def motor_position(port):
    """Position of the motor, 0-359 degrees."""
    return int(_bench.position(str(port)))


def show_image(name, color="white"):
    """Images: smile, sad, heart, check, cross, arrow_up, square, dot, full."""
    _bench.show_image(str(name), str(color))


def set_pixel(x, y, color):
    """Light one pixel. x and y are 1, 2 or 3; (1, 1) is top left. color 'off' turns it off."""
    _bench.pixel(int(x), int(y), str(color))


def fill(color):
    _bench.fill(str(color))


def clear():
    _bench.clear()


def color():
    """Color the sensor sees: 'red', 'yellow', 'green', 'blue', 'white', 'black' or 'none'."""
    return str(_bench.color())


def hub_light(color):
    _bench.hub_light(str(color))


def beep():
    _bench.beep()


def wait(seconds):
    _bench.wait(float(seconds))


def timer():
    return float(_bench.timer())


def say(*values):
    _bench.say(" ".join(str(v) for v in values))
