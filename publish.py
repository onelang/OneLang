#!/usr/bin/env python2

ga_tracking_code = '''
    <!-- Global site tag (gtag.js) - Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=UA-114302089-1"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'UA-114302089-1');
    </script>
'''.strip()

with open('index.html', 'r') as f: content = f.read()
content = content.replace("<head>", "<head>\n" + ga_tracking_code)
with open('index.html', 'w') as f: f.write(content)
