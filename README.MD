# Webcam Mouse
## What is this?

Yet another image processing program, but with a twist. This is made for the end user.

I made this so I can do things like move my mouse with a water jug cap. I used it to navigate around my computer, to paint a picture, and even to look around by moving my head in minecraft.

![Filter Menu Working](https://dzwonsemrish7.cloudfront.net/items/1Q3V25460g1H0y0o0v2F/Screenshot%20(20).png "Filter Menu Working")

There is a bit of config options, and I only use a specific config currently. For the mouse, there is a checkbox to make the tracked object to move the mouse. I taped a purple plastic water jug lid to my forehead, set the filter to `Find Magenta`, tuned the tolerance to the light level in the room, then opened minecraft and set it to fullscreen with mouse sensitivity to `* yawn *`. When I moved my head, the web page captures the movement, sends it to the server, which then tells the os to move the mouse and minecraft reads it as a mouse movement.

## Getting Started

Run `server.js` and point your internet browser to `127.0.0.1`.

You will see the Filter List menu when it first opens.

![Multiple Filters and actions](https://dzwonsemrish7.cloudfront.net/items/44262B2p2w2x1m0K1X0I/Screenshot%20(24).png "Multiple Filters and actions")

## Options

### You can now have multiple filters!!!

This is the Edit Filter menu.

![Edit filter menu](https://dzwonsemrish7.cloudfront.net/items/3r3j3L3H113r033I2I2l/Screenshot%20(22).png "Edit filter menu")

### Filter Modes
`No Filter` is just a blank filter. It is good for using a webcam as a mirror to setup things.

`High Contrast` mode is good for when the object you want to focus on is brighter than the background, or for vice versa turn on inverted. Turn up the tolerance to tolerate less (I might adjust that in the future).

`Target Color` mode is for targeting a specific color in the scene. It can be difficult with many colors in the scene, but it works well for when there is good lighting. I am styling the color selector. Currently it only supports hue, but saturation and value adjusting is coming soon!

`Light Map` Exactly the same as `Target Color`, but displays as the hue found and not the targeted hue.

`Find Green` and `Find Magenta` is good for any lighting, and is good for finding any shade of the specified color. A good example of this is `Find Green` inverted to find objects against a green screen.

### Inverted Toggle
Press this toggle to invert the passed pixels. For high contrast, it looks for black pixels from the filter. When inverted, it looks for white pixels. The inversion idea works on all filter modes except for `No Filter`.

### Bounding Box and Dead Zone
There are individual toggles for the bounding box and the dead zone for the filter. Click the dead zone toggle to turn off just the dead zone. Click the bounding box toggle to remove the bounding box and dead zone completely.

There are buttons to set the regions for both. Click on one of the buttons to edit the respective region by pressing down the left mouse button on the top left of where you want the region to start. While still holding down the left mouse button, drag the mouse to where you want to end the region and release the button. If you click somewhere other than the camera screen, it will exit the mode.

There are also input boxes on the menu for fine tuning your bounding box by typing in the number, or use the up and down arrow keys to jump `0.005` higher or lower.

- Side note: Dead zones are currently broken and is on my to-do-soon list.

### Flip Image
Press `[F]` on the keyboard to flip the camera feed on the x axis.

### Pause Camera
Press `[Space]` on the keyboard to pause or play the camera stream.

### Censor Toggle
`Hide Sensitive Data` will fill the camera with another color so your raw camera data will be hidden from the screen. Turn this off to just fill the pixels that passed through the filter.

## Filter Actions

When you have setup your filter and are happy with the object recognition, you can use the tracking for different actions.

`Mouse Pos` will make the mouse on the screen relative to the object's x and y inside its filter's bounding box.

`Left Mouse` will press and hold the left mouse button down if there is an object found. If there is no object found, the mouse left button will be released.

`Right Mouse` is similar to `Left Mouse` except that it is for the right mouse button instead of the left.

## Future

I am going to be working on having multiple filters in the scene and each filter will have their own bounding boxes and events. With the events, you will be able to, for example, designate a small part of the screen to a button on the keyboard.

### *Update*
The Filter Menu and Filter Actions are now available.
Keyboard actions are on the to do list.

More options are to come. More actions are to come. More readme file is to come. I am off to make a video of it. [Stay tuned](http://youtube.com/Tgwizman)!

![Multiple Filters and actions](https://dzwonsemrish7.cloudfront.net/items/3g0S3f470e0W0d1F4724/Screenshot%20(21).png "Multiple Filters and actions")

## Old Images

![Bounding box for screen button](https://dzwonsemrish7.cloudfront.net/items/1w2f0n3i2b1G190o0e3j/Screenshot%20(18).png "Bounding box for screen button")

![Find Color](https://dzwonsemrish7.cloudfront.net/items/0Q1J2s0Z1i122E1v0823/Screenshot%20(7).png "Find Color")

![Find Magenta](https://dzwonsemrish7.cloudfront.net/items/1J2D3d1i0A2d2N2q0O0a/Screenshot%20(9).png "Find Magenta")

![Find Green](https://dzwonsemrish7.cloudfront.net/items/1l3B0P220W0d3H0J3y3n/Screenshot%20(11).png "Find Green")

![Head Tracking](https://dzwonsemrish7.cloudfront.net/items/1F1A2A3v0b262D2f143V/Screenshot%20(12).png "Head Tracking")