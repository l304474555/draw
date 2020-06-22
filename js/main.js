var timeOutEvent = ''; // 长按定时器
	    mainVue = new Vue({
	        el: '#ele',
	        data: {
	            // requesUrl: 'http://192.168.111.107:9334', //测试
	            // requesWebUrl: 'http://192.168.111.181:8899',
	            requesUrl: 'https://vmapi.myj.com.cn', //正式
	            requesWebUrl: 'https://padapi.meiyijia.com.cn',
	            listConfig: '',
	            layerList: [],
	            dragItem: '',
	            dragIndex: '',
	            dropItem: '',
	            configInfo:
				//{ SeatsPerLayer: '10,7,5,3,7,1', "page": 1, "pagesize": 1000, "sortname": "layer", "sortorder": "DESC", "userid": "PAD_8910", "StoreCode": "0198", "CompanyCode": "GD", "StoreModuleId": "5195e956-b01d-445d-a352-65eda2fc0e23", "unit": 0, "layer": 0, "position": 0 },
	
	            {
	                userid: 'APP_店长',
	                CompanyCode: 'GD',
	                StoreModuleId: '9720da44-07d2-4589-916a-2a4d63b4ec28',
	                StoreCode: '0198',
	                SeatsPerLayer: '10,7,5,3,7,1',
	                StoreModuleName: '',
	                LocationGoodsCode: ''
	            },
	            goodsList: [],//商品列表
	            isShowAdd: false,
	            addItem: '',
	            showBaoHuo: false, //报货弹窗
	            showBaoHuoList: false, //报货列表弹窗
	            baohuoItem: '',
	            baohuoList: [],
	            cIp: '0.0.0.0',
	
	            edit: {
	                isInEditing: false,
	                btnText: '全选',
	                chooseList: []
	            },
	
	            isDrag: false,
	
	            drawTempList: JSON.parse(localStorage.getItem('drawTempList')) || [],//临时拖拽栏.
	            tempScale:1,
	
	            copyObj: {
	                show: false,
	                hasItem: false,
	                isDraging: false,
	                item: '',
	                tempLayItem: '',
	                x: 0,
	                y: 0,
	            }
	        },
	        created: function () {
	            var that = this
	            function GetRequest() {
	                var url = decodeURI(location.search); //获取url中"?"符后的字串
	                var theRequest = new Object();
	                if (url.indexOf("?") != -1) {
	                    var str = url.substr(1);
	                    strs = str.split("&");
	                    for (var i = 0; i < strs.length; i++) {
	                        theRequest[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
	                    }
	                }
	                return theRequest;
	            }
	            var json = GetRequest();
	            if (json.userid) {
	                this.configInfo = json //获取门店配置
	            }
	
	            var resize = function() {
	                var innerWidth = (window.innerWidth)
	                if (innerWidth < 800) {
	                    that.tempScale = 0
	                } else {
	                    that.tempScale = 1
	                }
	            }
	            resize()
	            window.onresize = function () {
	                resize()
	            }
	            
	        },
	        mounted: function() {
	            this.randerListConfig();
	            this.getCip();
	            var that = this
	            window.addEventListener("storage", function (e) {
	                console.log(e)
	                if (typeof (e.newValue) == 'string') {
	                    that.drawTempList = JSON.parse(e.newValue)
	                } else {
	                    that.drawTempList = (e.newValue)
	                }
	            });
	        },
	        methods: {
	            getLocationGoodsCode: function (LocationGoodsCode) {
	                var that = this
	                this.layerList.forEach(function (item) {
	                    if (item._detail && item._detail.GoodsCode == (that.configInfo.LocationGoodsCode || LocationGoodsCode)) {
	                        that.$set(item._detail, '_IsScan', true)
	                    }
	                })
	            },
	            getCip: function () {
	                if (window.android) {
	                    window.android.getIPAddress()
	                } else {
	                }
	            },
	            getIPAddress: function (res) {
	                if (res) {
	                    try {
	                        var data = JSON.parse(res)
	                        this.cIp = data.Data.userip
	                    } catch (err) {
	
	                    }
	                }
	            },
	            randerListConfig: function () {
	                var seatsPerLayerArr = this.configInfo.SeatsPerLayer.split(',')
	                console.log(seatsPerLayerArr)
	                var layerList = []
	                var maxFlag = 0
	                seatsPerLayerArr.forEach(function (item) {
	                    if (maxFlag < item) {
	                        maxFlag = item
	                    }
	                })
	                for (var i = 0; i < seatsPerLayerArr.length; i++) {
	                    var width = (maxFlag / seatsPerLayerArr[i] / maxFlag) * 100 + '%';
	                    for (var flag = 1; flag <= seatsPerLayerArr[i]; flag++) {
	                        layerList.push({
	                            layer: i + 1,
	                            position: flag,
	                            width: width,
	                            seatsPerLayer: seatsPerLayerArr[i],
	                            index: layerList.length
	                        })
	                    }
	                }
	                this.layerList = layerList
	                console.log(layerList)
	                this.getGoodsList()
	            },
	            getGoodsList: function() {
	                var that = this,
	                    param = { "page": 1, "pagesize": 1000, "sortname": "layer", "sortorder": "DESC", "userid": this.configInfo.userid, "StoreCode": this.configInfo.StoreCode, "CompanyCode": this.configInfo.CompanyCode, "StoreModuleId": this.configInfo.StoreModuleId, "unit": 0, "layer": 0, "position": 0 }
	                $.ajax({
	                    url: this.requesUrl + '/api/StoreGoodsConfig/StoreGoodsConfigList',
	                    dataType: "json",
	                    'Content-Type': 'application/json;',
	                    data: param,
	                    type: "POST",
	                    success: function (res) {
	                        console.log(res)
							MINT.Indicator.close()
	                        if (res.Data.Code == 1) {
	                            that.goodsList = res.Data.Result.Main
	                            that.getGoodsKuCun()
	                        }
	                    },
	                })
	            },
	            AllDayQuery_ShopCartNumber: function () {
	                var that = this
	                var GoodList = [];
	                this.goodsList.forEach(function (g) {
	                    GoodList.push(g.GoodsCode || 0)
	                })
	                function unique(arr) {
	                    for (var i = 0; i < arr.length; i++) {
	                        for (var j = i + 1; j < arr.length; j++) {
	                            if (arr[i] == arr[j]) { //第一个等同于第二个，splice方法删除第二个
	                                arr.splice(j, 1);
	                                j--;
	                            }
	                        }
	                    }
	                    return arr;
	                }
	                GoodList = unique(GoodList)
	                window.android.allDayQuery_ShopCartNumber(JSON.stringify(GoodList))
	            },
	            allDayQuery_ShopCartNumberResult: function (res) {
	                var that = this
	                res = JSON.parse(res)
	                if (!res.IsError) {
	                    var _BHChuli = res.Data.Rows
	                    that.layerList.forEach(function (item) {
	                        item._detail && that.$set(item._detail, '_BHChuli', 0)
	                        _BHChuli.forEach(function (resItem) {
	                            if ( (item._detail && item._detail.GoodsCode*1) == resItem.ProductCode*1) {
	                                that.$set(item._detail, '_BHChuli', (resItem.BaoHuoNum || 0))
	                            }
	                        })
	                    })
	                }
	            },
	            BatchQuery_ShopCartNumber: function ()  {
	                var that = this
	                var GoodList = [];
	                this.goodsList.forEach(function (g) {
	                    GoodList.push(g.GoodsCode)
	                })
	                function unique(arr) {
	                    for (var i = 0; i < arr.length; i++) {
	                        for (var j = i + 1; j < arr.length; j++) {
	                            if (arr[i] == arr[j]) { //第一个等同于第二个，splice方法删除第二个
	                                arr.splice(j, 1);
	                                j--;
	                            }
	                        }
	                    }
	                    return arr;
	                }
	                GoodList = unique(GoodList)
	                window.android.batchQuery_ShopCartNumber(JSON.stringify(GoodList))
	            },
	            batchQuery_ShopCartNumberResult: function (res) {
	                var that = this				
	                res = JSON.parse(res)
	                if (!res.IsError) {
	                    var _BHWeiChuli = res.Data.Rows
	                    that.layerList.forEach(function (item) {
	                        item._detail && that.$set(item._detail, '_BHWeiChuli', 0)
	                        _BHWeiChuli.forEach(function (resItem) {
	                            if ((item._detail && item._detail.GoodsCode*1) == resItem.ProductCode) {
	                                that.$set(item._detail, '_BHWeiChuli', (resItem.BaoHuoNum || 0))
	                            }
	                        })
	                    })
	                }
	            },
	            getGoodsKuCun: function() {
	                var gids = [], that = this;
	                this.goodsList.forEach(function (item) {
	                    that.$set(item, '_BaoHuo', 0)
	                    if (item.GID) {
	                        gids.push(item.GID)
	                    }
	                })
	                if (window.android) {
	                    function group(array, subGroupLength) {
	                        var index = 0;
	                        var newArray = [];
	                        while (index < array.length) {
	                            newArray.push(array.slice(index, index += subGroupLength));
	                        }
	                        return newArray;
	                    }
	                    gids = group(gids, 50)
	                    gids.forEach(function (g) {
	                        window.android.batchQueryInvs(JSON.stringify(g))
	                    })
	
	                } else {
	                    that.layerList.forEach(function (item) {
	                        that.goodsList.forEach(function (resItem) {
	                            if (item.layer == resItem.layer && item.position == resItem.position) {
	                                that.$set(item, '_detail', resItem)
	                            }
	                        })
	                    })
	                    this.getLocationGoodsCode()
	                }
	            },
	            batchQueryInvsResult: function(result) {
	                var that = this
	                var res = JSON.parse(result)
	                if (res.IsError) {
	                    that.layerList.forEach(function (item) {
	                        that.goodsList.forEach(function (resItem) {
	                            if (item.layer == resItem.layer && item.position == resItem.position) {
	                                that.$set(item, '_detail', resItem)
	                            }
	                        })
	                    })
	                } else {
	                    res.Data.Rows.forEach(function (resItem) {
	                        that.goodsList.forEach(function (item) {
	                            if (item.GID == resItem.gdgid) {
	                                that.$set(item, '_qty', resItem.qty)
	                            }
	                        })
	                    })
	                    that.layerList.forEach(function (item) {
	                        that.goodsList.forEach(function (resItem) {
	                            if (item.layer == resItem.layer && item.position == resItem.position) {
	                                that.$set(item, '_detail', resItem)
	                            }
	                        })
	                    })
	                    console.log(that.layerList)
	                }
	                this.AllDayQuery_ShopCartNumber()
	                this.BatchQuery_ShopCartNumber()
	
	                this.getLocationGoodsCode()
	            },
	
	            switchAddpop: function(item) {
	                console.log(item)
					console.log(this.edit.isInEditing)
					if (this.edit.isInEditing) {
					    return console.warn('编辑中，不允许点击')
					}
	                if (item._detail) {
						if (window.android) {
	                        var parm = {
	                            GoodsCode: item._detail.GoodsCode,
	                            Layer: item.layer,
	                            Position: item.position,
	                            StoreModuleId: item._detail.StoreModuleId,
	                            SeatsPerLayer: item.seatsPerLayer,
	                            StoreModuleName: this.configInfo.StoreModuleName,
	                            GID: item._detail.GID
	                        }
	                        window.android.startGoodsShelfGoodsDetailActivity(JSON.stringify(parm))
	                    }
	                    return
	                }
	                this.isShowAdd = !this.isShowAdd
	                this.addItem = item ? item : ''
	            },
	            addGoods: function(type) {
	                switch (type) {
	                    case 'scan':
	                        if (window.android) {
	                            var parm = { "Layer": this.addItem.layer, "Position": this.addItem.position, "StoreModuleId": this.configInfo.StoreModuleId, "StoreModuleName": this.configInfo.StoreModuleName, "SeatsPerLayer": this.addItem.seatsPerLayer }
	                            window.android.startGoodsShelfScanSelectGoodsActivity(JSON.stringify(parm))
	                        }
	                        break;
	                    case 'search':
	                        if (window.android) {
	                            var parm = { "Layer": this.addItem.layer, "Position": this.addItem.position, "StoreModuleId": this.configInfo.StoreModuleId, "StoreModuleName": this.configInfo.StoreModuleName, "SeatsPerLayer": this.addItem.seatsPerLayer }
	                            window.android.startGoodsShelfGoodsSearchActivity(JSON.stringify(parm));
	                        }
	                        break;
	                }
	                this.switchAddpop()
	            },
	
	            openBaoHuo: function(item) {
	                if (this.edit.isInEditing) {
	                    return console.warn('编辑中，不允许报货')
	                }
	                console.log(item)
	                if (item._detail) {
	                    this.showBaoHuo = true
	                    this.baohuoItem = JSON.parse(JSON.stringify(item))
	                    this.baohuoItem._detail._BaoHuo = this.baohuoItem._detail._BaoHuo || this.baohuoItem._detail.Alcqty
	                    this.getPromotionsModeInfo() //查询商品促销方式
	                    this.getStapleJybhlInfo() //查询商品建议报货量
	                }
	            },
	            getPromotionsModeInfo: function () {
	                var that = this
	                var parm = {
	                    "ShopCode": this.configInfo.StoreCode,
	                    "CompanyCode": this.configInfo.CompanyCode,
	                    "Goods": [this.baohuoItem._detail.GoodsCode]
	                }
	                $.ajax({
	                    url: this.requesWebUrl + '/api/GoodsStructure/GetPromotionsModeInfo',
	                    dataType: "json",
	                    'Content-Type': 'application/json;',
	                    data: parm,
	                    type: "POST",
	                    success: function (res) {
	                        if (!res.IsError) {
	                            res.Data[0] && res.Data[0].PromotionsMode && that.$set(that.baohuoItem._detail, 'PromotionsMode', res.Data[0].PromotionsMode)
	                        }
	                    },
	                })
	            },
	            getStapleJybhlInfo: function () {
	                 var that = this
	                var parm = {
	                    "ShopCode": this.configInfo.StoreCode,
	                    "CompanyCode": this.configInfo.CompanyCode,
	                    "Goods": [this.baohuoItem._detail.GoodsCode]
	                }
	                $.ajax({
	                    url: this.requesWebUrl + '/api/GoodsStructure/GetStapleJybhlInfo',
	                    dataType: "json",
	                    'Content-Type': 'application/json;',
	                    data: parm,
	                    type: "POST",
	                    success: function (res) {
	                        if (!res.IsError) {
	                            res.Data[0] && res.Data[0].JYBHL && that.$set(that.baohuoItem._detail, 'JYBHL', res.Data[0].JYBHL)
	                        }
	                    },
	                })
	            },
	            changeBaoHuo: function(type) {
	                switch (type) {
	                    case 'add':
	                        this.baohuoItem._detail._BaoHuo = parseInt(this.baohuoItem._detail._BaoHuo / this.baohuoItem._detail.Alcqty) * this.baohuoItem._detail.Alcqty + this.baohuoItem._detail.Alcqty * 1
	                        break;
	                    case 'reduce':
	                        if (this.baohuoItem._detail._BaoHuo <= 0) {
	                            this.baohuoItem._detail._BaoHuo = 0
	                            return
	                        }
	                        this.baohuoItem._detail._BaoHuo = parseInt(this.baohuoItem._detail._BaoHuo / this.baohuoItem._detail.Alcqty) * this.baohuoItem._detail.Alcqty - this.baohuoItem._detail.Alcqty * 1
	                        if (this.baohuoItem._detail._BaoHuo <= 0) {
	                            this.baohuoItem._detail._BaoHuo = 0
	                            return
	                        }
	                        break;
	                }
	            },
	
	            sureBaoHuo: function(type) {
	                switch (type) {
	                    case 'sure':
	                        console.log((this.baohuoItem._detail._BaoHuo))
	                        console.log(isNaN(this.baohuoItem._detail._BaoHuo))
	                        if (this.baohuoItem._detail._BaoHuo < 0) {
	                            MINT.Toast('报货数量不能小于0')
	                        } else if (this.baohuoItem._detail._BaoHuo === '' || isNaN(this.baohuoItem._detail._BaoHuo) || (this.baohuoItem._detail._BaoHuo % this.baohuoItem._detail.Alcqty != 0)) {
	                            MINT.Toast('报货数量必须为配货单位的倍数')
	                        } else {
	                            this.refreshBaoHuo()
	                            this.showBaoHuo = false
	                        }
	                        this.subBaoHuoList()
	                        this.sureBaoHuoList('sure')
	                        break;
	                    case 'cancel':
	                        this.baohuoItem = ''
	                        this.showBaoHuo = false
	                        break;
	                }
	            },
	            sureBaoHuoList: function(type) {
	                var that = this
	                switch (type) {
	                    case 'sure':
	                        console.log(this.cIp)
	                        console.log(this.baohuoList)
	                        if (!this.baohuoList.length) {
	                            return
	                        }
	                        var GoodsList = []
	                        this.baohuoList.forEach(function (bItem) {
	                            if (bItem._detail) {
	                                if (bItem._detail._BaoHuo) {
	                                    GoodsList.push({
	                                        GoodCode: bItem._detail.GoodsCode,
	                                        ReportNum: bItem._detail._BaoHuo
	                                    })
	                                }
	                            }
	                        })
	                        var param = {
	                            "userid": this.configInfo.userid,
	                            "userip": this.cIp,
	                            "StoreCode": this.configInfo.StoreCode,
	                            "CompanyCode": this.configInfo.CompanyCode,
	                            "GoodsList": GoodsList
	                        }
	                        that.showBaoHuoList = false
	
	                        //报货清空
	                        that.layerList.forEach(function (gItem) {
	                            if (gItem._detail) {
	                                if (gItem._detail._BaoHuo) {
	                                    gItem._detail._BaoHuo = 0
	                                }
	                            }
	                        })
	
	                        $.ajax({
	                            url: this.requesUrl + '/api/StoreGoods/StoreGoodsBaoHuoList',
	                            dataType: "json",
	                            'Content-Type': 'application/json;',
	                            data: param,
	                            type: "POST",
	                            success: function (res) {
	                                if (res.Data && res.Data.Code == 1) {
	                                    MINT.Toast({
	                                        message: res.Data.Msg,
	                                        position: 'bottom',
	                                    });
	
	                                    that.AllDayQuery_ShopCartNumber()
	                                    that.BatchQuery_ShopCartNumber()
	
	                                    //报货成功 添加item._detail._BHWeiChuli
	                                    //that.layerList.forEach(function (item) {
	                                    //    if (item._detail) {
	                                    //        GoodsList.forEach(function (goodItem) {
	                                    //            if (item._detail.GoodsCode == goodItem.GoodCode) {
	                                    //                that.$set(item._detail, '_BHWeiChuli', (item._detail._BHWeiChuli || 0) + goodItem.ReportNum)
	                                    //            }
	                                    //        })
	                                    //    }
	                                    //})
	                                    
	                                } else {
	                                    MINT.Toast({
	                                        message: res.Message || res.Data && res.Data.Msg,
	                                        position: 'bottom',
	                                    });
	                                }
	                            },
	                        })
	                        break;
	                    case 'cancel':
	                        this.showBaoHuoList = false
	                        break;
	                }
	            },
	
	            refreshBaoHuo: function() {
	                var that = this
	                this.layerList.forEach(function (gItem) {
	                    if (gItem._detail) {
	                        if (gItem._detail.GID == that.baohuoItem._detail.GID) {
	                            gItem._detail._BaoHuo = that.baohuoItem._detail._BaoHuo
	                        }
	                    }
	                })
	                that.baohuoItem = ''
	            },
	
	            subBaoHuoList: function() {
	                this.showBaoHuoList = true
	                var baohuoList = []
	                this.layerList.forEach(function (gItem) {
	                    if (gItem._detail) {
	                        if (gItem._detail._BaoHuo) {
	                            baohuoList.push(gItem)
	                        }
	                    }
	                })
	                for (var i = 0; i < baohuoList.length; i++) {
	                    for (var j = i + 1; j < baohuoList.length; j++) {
	                        if (baohuoList[i]._detail.GID == baohuoList[j]._detail.GID) {         //第一个等同于第二个，splice方法删除第二个
	                            baohuoList.splice(j, 1);
	                            j--;
	                        }
	                    }
	                }
	
	                this.baohuoList = baohuoList
	            },
	
	            deleBaoHuoListItem: function(item, index) {
	                this.layerList.forEach(function (gItem) {
	                    if (gItem._detail) {
	                        if (gItem._detail.GID == item._detail.GID) {
	                            gItem._detail._BaoHuo = 0
	                        }
	                    }
	                })
	                this.baohuoList.splice(index, 1)
	            },
	
	            dragstart: function(ev, index) {
	                if (this.edit.isInEditing) {
	                    return console.warn('编辑中，不允许拖拽')
	                }
	                console.log('dragstart拖拽开始事件，绑定于被拖拽元素上', ev)
	                this.copyObj.show = false
	                if(ev._detail) { this.copyObj.isDraging = true }
	                this.dragItem = JSON.parse(JSON.stringify(ev))
	                this.dragIndex = index
	            },
	            dragenter: function(e) {
	                e.preventDefault();
	            },
	            dragleave: function(e) {
	            },
	            draging: function(e) {
	            },
	            dragend: function(e) {
	                this.copyObj.isDraging = false
	            },
	            dragmove: function() {
	            },
	            dragover: function(e) {
	                e.preventDefault();
	            },
	            drop: function(ev, index) {
	                if (this.edit.isInEditing) {
	                    return console.warn('编辑中，不允许拖拽')
	                }
	                if (this.dragItem) {//拖拽商品
	                    var that = this
	                    this.dropItem = JSON.parse(JSON.stringify(ev))
	                    console.log(this.dropItem)
	                    console.log(this.dragItem)
	                    //drop区域为本身 不操作
	                    if (this.dropItem.index == this.dragItem.index) {
	                        return
	                    }
	                    //拖拽空格 不操作
	                    if (!this.dragItem._detail) {
	                        return
	                    }
	                    //交换两个商品
	                    if (this.dragItem._detail && this.dropItem._detail) {
	                        this.$set(this.layerList[index], '_detail', this.dragItem._detail);
	                        this.$set(this.layerList[this.dragIndex], '_detail', this.dropItem._detail)
	
	                        if (that.layerList[index]._detail) {
	                            that.layerList[index]._detail.layer = that.layerList[index].layer
	                            that.layerList[index]._detail.position = that.layerList[index].position
	                        }
	                        if (that.layerList[that.dragIndex]._detail) {
	                            that.layerList[that.dragIndex]._detail.layer = that.layerList[that.dragIndex].layer
	                            that.layerList[that.dragIndex]._detail.position = that.layerList[that.dragIndex].position
	                        }
	
	                        //交换即请求
	                        //var param = {
	                        //    "userid": this.configInfo.userid,
	                        //    "StoreCode": this.configInfo.StoreCode,
	                        //    "CompanyCode": this.configInfo.CompanyCode,
	                        //    "BeforeStoreModuleId": this.dragItem._detail.StoreModuleId,
	                        //    "Beforeunit": this.dragItem._detail.unit,
	                        //    "Beforelayer": this.dragItem._detail.layer,
	                        //    "Beforeposition": this.dragItem._detail.position,
	                        //    "BeforeGoodsCode": this.dragItem._detail.GoodsCode,
	                        //    "AfterGoodsCode": this.dropItem._detail.GoodsCode,
	                        //    "AfterStoreModuleId": this.dropItem._detail.StoreModuleId,
	                        //    "Afterunit": this.dropItem._detail.unit,
	                        //    "Afterlayer": this.dropItem._detail.layer,
	                        //    "Afterposition": this.dropItem._detail.position,
	                        //}
	                        //$.ajax({
	                        //    url: this.requesUrl + '/api/StoreGoodsConfig/StoreGoodsConfigUpdate',
	                        //    dataType: "json",
	                        //    'Content-Type': 'application/json;',
	                        //    data: param,
	                        //    type: "POST",
	                        //    success: function (res) {
	                        //        console.log(res)
	                        //        if (res.Data && res.Data.Code == 1) {
	                        //            if (that.layerList[index]._detail) {
	                        //                that.layerList[index]._detail.layer = that.layerList[index].layer
	                        //                that.layerList[index]._detail.position = that.layerList[index].position
	                        //            }
	                        //            if (that.layerList[that.dragIndex]._detail) {
	                        //                that.layerList[that.dragIndex]._detail.layer = that.layerList[that.dragIndex].layer
	                        //                that.layerList[that.dragIndex]._detail.position = that.layerList[that.dragIndex].position
	                        //            }
	                        //        } else {
	                        //             MINT.Toast(res.Message)
	                        //            that.$set(that.layerList[that.dragIndex], '_detail', that.dragItem._detail);
	                        //            that.$set(that.layerList[index], '_detail', that.dropItem._detail)
	                        //        }
	                        //    },
	                        //})
	                    }
	                    //交换单个商品和空白区域
	                    if (this.dragItem._detail && !this.dropItem._detail) {
	                        this.$set(this.layerList[index], '_detail', this.dragItem._detail);
	                        this.$set(this.layerList[this.dragIndex], '_detail', this.dropItem._detail)
	
	                        //交换
	                        if (that.layerList[index]._detail) {
	                            that.layerList[index]._detail.layer = that.layerList[index].layer
	                            that.layerList[index]._detail.position = that.layerList[index].position
	                        }
	                        if (that.layerList[that.dragIndex]._detail) {
	                            that.layerList[that.dragIndex]._detail.layer = that.layerList[that.dragIndex].layer
	                            that.layerList[that.dragIndex]._detail.position = that.layerList[that.dragIndex].position
	                        }
	
	                        //请求
	                        //var param = {
	                        //    "userid": this.configInfo.userid,
	                        //    "StoreCode": this.configInfo.StoreCode,
	                        //    "CompanyCode": this.configInfo.CompanyCode,
	                        //    "BeforeStoreModuleId": this.dragItem._detail.StoreModuleId,
	                        //    "Beforeunit": this.dragItem._detail.unit,
	                        //    "Beforelayer": this.dragItem._detail.layer,
	                        //    "Beforeposition": this.dragItem._detail.position,
	                        //    "BeforeGoodsCode": this.dragItem._detail.GoodsCode,
	                        //    "AfterGoodsCode": '',
	                        //    "AfterStoreModuleId": this.dragItem._detail.StoreModuleId,//后需改成不同货架id
	                        //    "Afterunit": this.dragItem._detail.unit,//后需改成不同货架门的unit
	                        //    "Afterlayer": this.dropItem.layer,
	                        //    "Afterposition": this.dropItem.position,
	                        //}
	
	                        //$.ajax({
	                        //    url: this.requesUrl + '/api/StoreGoodsConfig/StoreGoodsConfigUpdate',
	                        //    dataType: "json",
	                        //    'Content-Type': 'application/json;',
	                        //    data: param,
	                        //    type: "POST",
	                        //    success: function (res) {
	                        //        console.log(res)
	                        //        if (res.Data && res.Data.Code == 1) {
	                        //            if (that.layerList[index]._detail) {
	                        //                that.layerList[index]._detail.layer = that.layerList[index].layer
	                        //                that.layerList[index]._detail.position = that.layerList[index].position
	                        //            }
	                        //            if (that.layerList[that.dragIndex]._detail) {
	                        //                that.layerList[that.dragIndex]._detail.layer = that.layerList[that.dragIndex].layer
	                        //                that.layerList[that.dragIndex]._detail.position = that.layerList[that.dragIndex].position
	                        //            }
	                        //        } else {
	                        //             MINT.Toast(res.Message)
	                        //            that.$set(that.layerList[that.dragIndex], '_detail', that.dragItem._detail);
	                        //            that.$set(that.layerList[index], '_detail', that.dropItem._detail)
	                        //        }
	                        //    },
	                        //})
	                    }
	                    this.dragItem = ''
	                    this.isDrag = true
	                }
	                console.log(this.dragTempItem)
	                if (this.dragTempItem) { //拖拽临时栏
	                    this.dropItem = JSON.parse(JSON.stringify(ev))
	                    //拖拽有商品 不操作
	                    if (this.dropItem._detail) {
	                        return
	                    } else {
	                        this.$set(this.layerList[index], '_detail', this.dragTempItem)
	                        //清除拖拽栏商品
	                        // this.deleteTemp('', this.dragTempItem._index, '')
	                    }
	                    this.dragTempItem = ''
	                    this.isDrag = true
	                }
	            },
	            dragend: function(event) {
	
	            },
	            gtouchstart: function gtouchstart(item, e) {
	                var that = this
	                that.copyObj.show = false
	                that.copyObj.hasItem = false
	                that.copyObj.isDraging = false
	                timeOutEvent = setTimeout(function () {
	                    if (that.copyObj.isDraging) {
	                        return
	                    }
	                    that.copyObj.tempLayItem = item
	                    if (item._detail) {
	                        that.copyObj.show = true
	                        that.copyObj.hasItem = true
	                    } else if (that.copyObj.item) {
	                        that.copyObj.show = true
	                        that.copyObj.hasItem = false
	                    }
						console.log(e)
	                    that.copyObj.x = e.touches[0].clientX
	                    that.copyObj.y = e.touches[0].clientY
	                }, 600);//这里设置定时器，定义长按500毫秒触发长按事件，时间可以自己改，个人感觉500毫秒非常合适
	                return false;
	            },
	            //手释放，如果在500毫秒内就释放，则取消长按事件，此时可以执行onclick应该执行的事件
	            gtouchend: function gtouchend(item) {
	                clearTimeout(timeOutEvent);//清除定时器
	                return false;
	            },
	            copyItem: function () {
	                this.copyObj.item = JSON.parse(JSON.stringify(this.copyObj.tempLayItem._detail))
	                MINT.Toast({ message: '复制成功', position: 'bottom', })
	            },
	            pasteItem: function () {
	                this.$set(this.copyObj.tempLayItem, '_detail', this.copyObj.item)
	                this.isDrag = true
	            },
	            enterEdit: function () {
	                this.edit.isInEditing = true
	            },
	
	            hideEdit: function () {
	                this.edit.isInEditing = false
	            },
	
	            chooseItem: function (item) {
	                console.log(item)
	                if (item._detail) {
	                    if (item._detail._choosed) {
	                        item._detail._choosed = false
	                    } else {
	                        this.$set(item._detail, '_choosed', true)
	                    }
	                }
	            },
	            subChoose: function () {
	                var that = this
	                this.edit.chooseList = []
	                this.layerList.forEach(function (item) {
	                    if (item._detail && item._detail._choosed) {
	                        that.edit.chooseList.push(item._detail)
	                    }
	                })
	                console.log(that.edit.chooseList)
	                return that.edit.chooseList
	            },
	            editChoose: function () {
	                var that = this
	                if (this.edit.btnText == '全选') {
	                    this.edit.btnText = '反选'
	                    this.layerList.forEach(function (item) {
	                        if (item._detail) {
	                            that.$set(item._detail, '_choosed', true)
	                        }
	                    })
	                } else {
	                    this.edit.btnText = '全选'
	                    this.layerList.forEach(function (item) {
	                        if (item._detail) {
	                            that.$set(item._detail, '_choosed', false)
	                        }
	                    })
	                }
	            },
	            dropTemp: function (ev) {
	                var that = this
	                if (this.dragItem && this.dragItem._detail) {
	                    var dragItem = JSON.parse(JSON.stringify(this.dragItem))
	                    dragItem._detail._BaoHuo = 0 //清空报货 月销 库存
	                    dragItem._detail.MonthlySales = 0
	                    dragItem._detail._qty = 0
	                    this.drawTempList.push(dragItem._detail)
	
	                    //清空列表数据
	                    this.layerList.forEach(function (item) {
	                        if (item.layer == dragItem.layer && item.position == dragItem.position) {
	                            item._detail = ''
	                        }
	                    })
	
	                    this.dragItem = ''
	                    this.isDrag = true
	                    localStorage.setItem('drawTempList', JSON.stringify(this.drawTempList))
	                }
	                console.log(this.dropItem)
	                console.log(this.dragItem)
	            },
	            deleteTemp: function (item, index, type) {
	                console.log(index)
	                if (type == 'all') {
	                    this.drawTempList = []
	                } else {
	                    this.drawTempList.splice(index, 1)
	                }
	                localStorage.setItem('drawTempList', JSON.stringify(this.drawTempList))
	            },
	            dragstartTemp: function (item, index) {
	                console.log(item)
	                this.dragItem = ''
	                this.dragTempItem = item
	                this.dragTempItem._index = index
	            },
	            allUpdate: function () {
	                var that = this
	                var goods = []
	                MINT.Indicator.open()
	                this.layerList.forEach(function (item) {
	                    item = JSON.parse(JSON.stringify(item))
	                    if (item._detail) {
	                        item._detail.layer = item.layer
	                        item._detail.position = item.position
	                        goods.push(item._detail)
	                    }
	                })
	                var param = {
	                    "userid": this.configInfo.userid,
	                    "userip": this.cIp,
	                    "StoreCode": this.configInfo.StoreCode,
	                    "CompanyCode": this.configInfo.CompanyCode,
	                    "StoreModuleId": this.configInfo.StoreModuleId,
	                    "goods": goods
	                }
	                debugger
	                $.ajax({
	                    url: this.requesUrl + '/api/StoreGoodsConfig/StoreGoodsConfigAllUpdate',
	                    dataType: "json",
	                    'Content-Type': 'application/json;',
	                    data: param,
	                    type: "POST",
	                    success: function (res) {
	                        MINT.Indicator.close()
	                        if (res.Data && res.Data.Code == 1) {
	                            MINT.Toast({
	                                message: res.Data.Msg,
	                                position: 'bottom',
	                            });
	                        } else {
	                            MINT.Toast({
	                                message: res.Message || res.Data && res.Data.Msg,
	                                position: 'bottom',
	                            });
	                        }
	                    },
	                })
	            },
	            monthlyC: function (item) {
	                if (item._detail.MonthlySales <= 50) {
	                    return 'background:#ffff00'
	                } else if (item._detail.MonthlySales >= 400) {
	                    return 'background:#0000ff'
	                } else {
	                    return ''
	                }
	            },
	            qtyC: function (item) {
	                if (item._detail._qyt == 0 || item._detail._qty < (item._detail.downlimit || 0)) {
	                    return 'background:#ff0000'
	                } else {
	                    return ''
	                }
	            },
	            saveDrag: function () {
	                this.allUpdate()
	                this.isDrag = false
	            },
	            cancelDrag: function () {
	                this.isDrag = false
					MINT.Indicator.open()
					this.randerListConfig()
	            }
	        },
	        watch: {
	            isDrag: function (val) {
	                console.log(val)
	                if (window.android) {
	                    window.android.isScrollable(!val)
	                }
	            },
	            drawTempList: function (val) {
	                console.log(val)
	                var storage = new Event("storage");
	                storage.newValue = val;
	                window.dispatchEvent(storage);
	            },
	        },
	        filters: {
	            filterMonthSale: function (value) {
	                if (value) {
	                    if (value > 9999) {
	                        return 'N+'
	                    } else {
	                        return value
	                    }
	                } else {
	                    return 0
	                }
	            },
	            filterQty: function (value) {
	                if (value) {
	                    if (value > 9999) {
	                        return 'N+'
	                    } else {
	                        return value
	                    }
	                } else {
	                    return 0
	                }
	            }
	        }
	    })
	
	
	    function batchQueryInvsResult(result) {
	        mainVue.batchQueryInvsResult(result)
	    }
	    function getIPAddress(result) {
	        mainVue.getIPAddress(result)
	    }
	    var submitReportGoods = function () {
	        mainVue.subBaoHuoList()
	    }
	
	    function enterEdit() {
	        mainVue.enterEdit()
	    }
	
	    function hideEdit() {
	        mainVue.hideEdit()
	    }
	
	    function subChoose() {
	        window.android.subChoose(JSON.stringify(mainVue.subChoose()))
	    }
	
	    function allUpdate() {
	        mainVue.allUpdate()
	    }
	
	    function getLocationGoodsCode(goods) {
	        mainVue.getLocationGoodsCode(goods)
	    }
	
	    function allDayQuery_ShopCartNumberResult(res) {
	        mainVue.allDayQuery_ShopCartNumberResult(res)
	    }
	
	    function batchQuery_ShopCartNumberResult(res) {
	        mainVue.batchQuery_ShopCartNumberResult(res)
	    }