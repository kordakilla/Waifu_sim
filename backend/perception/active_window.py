import pygetwindow as gw


def get_active_window():

    try:

        window = gw.getActiveWindow()

        if not window:
            return None

        return window.title

    except:
        return None