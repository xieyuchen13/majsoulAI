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


if __name__ == "__main__":
    month_data = []
    for i in range(1, 29):
        day = i
        if day < 10:
            day = '0' + str(day)
        else:
            day = str(day)
        date_data = get_data_by_date("2020-05-" + day + " 00:00:00")
        month_data += date_data
    with open("2020-05_data.json", "w") as f:
        json.dump(month_data, f)