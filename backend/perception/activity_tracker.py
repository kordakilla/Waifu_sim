import time

from perception.active_window import (
    get_active_window
)

current_window = None

window_start_time = time.time()


def update_activity():

    global current_window
    global window_start_time

    title = get_active_window()

    if not title:
        return

    if title != current_window:

        current_window = title

        window_start_time = time.time()


def get_activity_data():

    duration = int(
        time.time()
        - window_start_time
    )

    return {

        "window": current_window,

        "duration": duration
    }