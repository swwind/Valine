# Valine EX

Fork from [xCss/Valine@1.1.8-beta][xcss].

[Demo](https://valine.swwind.me)

size: 55.2kb (`dist/valine-ex.min.js`)

## Feature

- New reply layout(same as [xCss/Valine@1.2.0-beta][xcss]).
- User system(No one can impersonate you now).
- Removed lots of things.

## Usage

```html
<div id="comment"></div>
<!-- hosted on netlify -->
<script src="https://valine.swwind.me/dist/valine-ex.min.js"></script>
<script type="text/javascript">
let valine = new Valine();
valine.init({
  el: document.querySelector('#comment'),
  appId: 'xxxxxxxxxxxxxxxxxxx',
  appKey: 'xxxxxxxxxxxxxxx',
  avatar: 'mm'
})
</script>
```

[xcss]: https://github.com/xCss/Valine
