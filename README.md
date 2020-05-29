# 牌谱AI

## 牌谱爬取

### 概述

为了训练日麻AI，我们首先需要爬取足量的现实牌谱作为训练数据。

雀魂牌谱屋（https://amae-koromo.sapk.ch/ ）是一个第三方维护的牌谱收集网站，收集了2019年8月23日开始的对局数据。网页如下图所示，可以看到，我们希望可以爬取一位的牌谱作为训练数据，从而使得我们可以更好地模拟一位玩家的行为，做出更好的决策。

![image-20200528194622119](images\image-20200528194622119.png)

查看元素可以看到一个典型的牌谱链接，包含了一个较长的牌谱id。

```html
<a href="https://www.majsoul.com/1/?paipu=200528-ea7f2269-f3c0-484c-b8c2-d6540f3e3f64_a85645395" title="查看牌谱" target="_blank" rel="noopener noreferrer">[豪1] lovecccc [49600]</a>
```

点击链接之后，发现会首先进行登录，然后会逐步加载到牌谱查看界面，通过chrome浏览器的开发者工具我们可以发现，雀魂的数据通信是通过websocket实现，客户端与服务器连接之后，客户端会通过不断地发送二进制信息实现与服务器的通信，从而获得用户状态，牌谱等信息。下图展示了获取牌谱的信息，可以看到，信息中包含了“fetchGameRecord”用以标识信息的类型，同时也包含了之前提到的牌谱id。

![image-20200528195644686](images\image-20200528195644686.png)

因此，我们可以确定整体的爬取过程。首先，从雀魂牌谱屋中批量获取牌谱id，然后，通过模拟浏览器的行为与服务器进行通信，获取牌谱id对应的牌谱信息，最后解析服务器返回的牌谱信息，保存为易于处理和理解的形式。

### 批量获取牌谱id

雀魂牌谱屋的数据是采用流式加载的形式，向下滑动可以加载更多的数据。随意地向下滑动并打开开发者工具，我们可以清晰地看到大量极为一致的请求，显然是用于请求牌谱数据的请求，不难看出请求共计包含三个参数，其中两个参数为skip和limit，skip表示返回时跳过前多少条数据，limit表示需要返回多少条数据，如果不设置这两个参数则默认返回前100条数据。第三个参数为一长串数字，显然是用于标识时间。为了得到表示时间的具体规律，调节时间并查看不同的请求可以看出，2020年5月28日对应“1590595200000 ”，2020年5月27日对应“1590508800000”，不难发现，该字符串是单位为毫秒的时间戳。

同时，我们发现可以采用形如“https://ak-data-3.sapk.ch/api/count/1590595200000” 的请求获取对应日期的牌谱数量。

![image-20200528201143663](images\image-20200528201143663.png)

因此，可以通过下面的程序获取需要的牌谱id列表。

```python
import requests
import time
import json

def date_to_timestamp(date, format_string="%Y-%m-%d %H:%M:%S"):
    time_array = time.strptime(date, format_string)
    time_stamp = int(time.mktime(time_array)) * 1000
    return str(time_stamp)


def get_data_by_date(date):
    print("开始爬取" + date + "的牌谱id列表。")
    time_stamp = date_to_timestamp(date)
    count_url = "https://ak-data-1.sapk.ch/api/count/" + time_stamp
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) '
                         'Chrome/71.0.3578.98 Safari/537.36'}
    
    try:
        req = requests.get(count_url, headers=headers)
        data = json.loads(req.text)
        count = data["count"]
        print("共计包含牌谱数据" + str(count) + "条。")
    except:
        return []

    date_data = []
    for i in range(int(count / 100)):
        try:
            url = "https://ak-data-1.sapk.ch/api/games/" + time_stamp + "?skip=" + str(i*100) + "&limit=100"
            req = requests.get(url, headers=headers)
            data = json.loads(req.text)
            date_data += data
        except:
            pass
    return date_data
```

加上try是因为远端请求的链接有时候不太稳定，会返回错误的结果，而我们并不要求数据的连续性，因此对于返回错误的就直接忽略，而不重新进行请求。

尝试获取2020年5月1日至2020年5月28日的牌谱id列表，最终得到了103200条牌谱数据。