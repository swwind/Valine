# Valine EX

Fork from [xCss/Valine@1.1.8-beta][xcss].

[Demo][demo]

size: 55.2kb (`dist/valine-ex.min.js`)

## Feature

- New reply layout(same as now).
- User system(No one can impersonate you now).
- Removed lots of things which I think is useless.

## Usage

```html
<div id="comment"></div>
<!-- hosted on netlify -->
<script src="https://valine.swwind.me/dist/valine-ex.min.js"></script>
<script type="text/javascript">
let valine = new Valine();
valine.init({
  el: document.querySelector('#comment'), // or just '#comment'
  appId: 'xxxxxxxxxxxxxxxxxxx',
  appKey: 'xxxxxxxxxxxxxxx',
  avatar: 'mm'
})
</script>
```

## FAQ

### What can logged user do but tourist can not?

**User title**

> If you are the owner of the site, you can choose to display a title after your machine version.

Open leancloud dashboard, open `_User` class, the `title` attribute is the what you want.

Just modify it.

**Private Reply**

Add an `admin:true` attribute to your user.

[demo]: https://valine.swwind.me
[xcss]: https://github.com/xCss/Valine
