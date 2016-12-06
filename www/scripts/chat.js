window.onload = function(){
    var chat = new highChat();
    chat.init();
}
var $ = function(el){
    return document.getElementById(el);
}

var highChat = function(){
    this.socket = null;
}
var that;
highChat.prototype = {
    init:function(){
        that = this;
        this.socket = io.connect();
        this.socket.on('connect',function(){
            $('nickWrapper').style.display = 'block';
            $('nicknameInput').focus()
        })
        this.socket.on('nicked',function(){
            $('error').textContent = '选择另外一个昵称吧!';
        })
        this.socket.on('loginSuccess',function(){
            document.title = 'highchat| ' + $('nicknameInput').value;
            $('loginWrapper').style.display = 'none';
            $('messageInput').focus();
        })
        this.socket.on('system',function(nickName,userCount,type){
            var msg = nickName + (type == 'login' ? '  加入' : '   离开');
            that.displayMsg('系统提示',msg,'red');
            $('status').textContent = userCount + (userCount > 1 ? 'users' : 'user') + 'online';
        })
        this.socket.on('newMsg',function(user,msg,color){
            that.displayMsg(user,msg,color)
        })

        this.socket.on('newImg',function(user,img){
            that.displayMsg(user,img);
        })

        $('emoji').addEventListener('click',function(e){
            e.stopPropagation();
            var emojiwrapper = $('emojiWrapper');
            emojiwrapper.style.display = 'block';
        },false);
        document.body.addEventListener('click',function(e){
            e.stopPropagation();
            var emojiwrapper = $('emojiWrapper');
            if(e.target != emojiwrapper){
                emojiwrapper.style.display = 'none';
            }
        })
        //发送表情
        $('emojiWrapper').addEventListener('click',function(e){
            var target = e.target;
            if(target.nodeName.toLowerCase() == 'img'){
                $('messageInput').focus();
                $('messageInput').value = messageInput.value + '[emoji:' + target.title + ']';
            }
        },false)
        this.initEmoji();
        //发送图片
        $('sendImage').addEventListener('change',function(){
            if(!!this.files.length){
                var file = this.files[0];
                reader = new FileReader();
                if(!reader){
                    that.displayMsg('系统提示','你的浏览器暂不支持fileReader', 'red');
                    this.value = '';
                    return;
                }
                reader.addEventListener('load',function(){
                    this.value = '';
                    that.socket.emit('img',reader.result);
                    that.displayMsg('me',reader.result);
                });
                file ,reader.readAsDataURL(file);
            }
        })
    },
    initEmoji:function(){
        var emojiContainer = $('emojiWrapper');
        var docFragment = document.createDocumentFragment();
        for(var i =39;i>0;i--){
            var emojiItem = document.createElement('img');
                emojiItem.src = '../content/emoji/' + i + '.gif';
                emojiItem.title = i;
                docFragment.appendChild(emojiItem);
        };
        emojiContainer.appendChild(docFragment);
    },
    showEmoji:function(msg){
        var match;
        var result = msg;
        var reg = /\[emoji:\d+\]/g; 
        var emojiIndex;
        var totalEmoji = $('emojiWrapper').children.length;
        while(match = reg.exec(msg)){
            emojiIndex = match[0].slice(7, -1);
            if(emojiIndex > totalEmoji){
                result = result.replace(match[0], '[x]');
            }else{
                result = result.replace(match[0], '<img class="emoji" src=../content/emoji/' + emojiIndex + '.gif />')
            }
        }
        return result;
    },
    displayMsg:function(user,data,color){
        var container = $('historyMsg');
        var msgToDisplay = document.createElement('li');
        var date = new Date().toTimeString().substr(0,8);
        if(/emoji/g.test(data)){
            data = this.showEmoji(data);
        }
        msgToDisplay.innerHTML = user + '<span class="timespan">' + date + '</span>:' +data  
        if(/base64/g.test(data)){
            msgToDisplay.innerHTML = user + '<span class="timespan">' + date + '</span> <br/>' + '<a href=' + data + ' target="_blank"><img src=' + data+ ' /></a>';
        }
        msgToDisplay.style.color = color || '#000';
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    }
}

//loginBtn
$('nicknameInput').addEventListener('keyup', function(e){
    e = e || window.event;
    if(e.keyCode == 13){
        var nickName = $('nicknameInput').value;
        if(!!nickName.trim().length){
            that.socket.emit('login',nickName);
        }else{
            $('nicknameInput').focus();
        }
    }
},false)


//sendMsg
$('messageInput').addEventListener('keyup',function(e){
    e = e || window.event;
    if(e.keyCode == 13){
        msg = $('messageInput').value;
        color = $('colorStyle').value;
        $('messageInput').value = '';
        $('messageInput').focus();
        if(msg.trim().length != 0){
            that.socket.emit('postMsg',msg,color)
            that.displayMsg('我',msg,color);
        } 
    } 
},false)


