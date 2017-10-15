define([
    "jquery", "jquery-ui/ui/widget", "jquery.fileupload", 'artDialog'
], function($) {
    //the jquery.alpha.js and jquery.beta.js plugins have been loaded.
    // $(function() {
    //     $('body').alpha().beta();
    // });
    $(function() {
        var uploading = false;
        xhr = new XMLHttpRequest();
        $(".addPlugin").click(function(event) {
            var d1 = dialog({
                title: '上传插件',
                content: '<div class="uploadForm"><div><label for="">插件名称</label><input type="text" name="pluginName"></div><div><label for="">插件介绍</label><textarea name="pluginIntro"></textarea></div><div><label class="uploadBtn" for="pluginResource"><i></i><span>点击上传插件</span></label><input type="file" id="pluginResource" name="pluginResource" multiple style="display:none"></div><div><label for="">作者名称</label><input type="text" name="createUser"></div><div><label for="">上传者名称</label><input type="text" name="userName"></div><div><label for="">插件展示页名称(html的名称，留空则为index.html)</label><input type="text" name="pluginIndex"></div><a class="upload">提交</a></div>',
                cancelDisplay: false,
                cancel: function() {
                    xhr.abort();
                    uploading = false;
                },
                width: 350
            });
            $(".upload").click(function(event) {
                if (uploading) {
                    return;
                }
                var fileObj = document.getElementById("pluginResource").files; // js 获取文件对象
                var url = webUrl + '/uploadPlugins'; // 接收上传文件的后台地址
                var form = new FormData(); // FormData 对象
                form.append('pluginName',$("[name=pluginName]").val())
                form.append('pluginIntro',$("[name=pluginIntro]").val())
                form.append('createUser',$("[name=createUser]").val())
                form.append('userName',$("[name=userName]").val())
                form.append('pluginIndex',$("[name=pluginIndex]").val())
                $.each(fileObj, function(index, el) {
                    form.append("file" + index, el);
                });
                // 文件对象
                 // XMLHttpRequest 对象
                xhr.open("post", url, true); //post方式，url为服务器请求地址，true 该参数规定请求是否异步处理。
                xhr.onload = function(e) {
                    uploading = false;
                    var data = JSON.parse(e.target.responseText);
                    d1.close().remove();
                    if (data.flag) {
                        showlog(data.message)
                    } else {
                        showlog('上传失败，原因是：' + data.message)
                    }
                }; //请求完成
                xhr.onerror = function(e) {
                    d1.close().remove();
                    showlog('上传失败！')
                }; //请求失败
                xhr.upload.onprogress = function(evt) {
                    uploading = true;
                    var progress = Math.round(evt.loaded / evt.total * 100);
                    $(".uploadBtn>i").css('width', progress + 'px');
                    $(".uploadBtn>span").html(progress + '%')
                    console.log(progress + '%')
                }; //【上传进度调用方法实现】
                xhr.upload.onloadstart = function() { //上传开始执行方法
                    console.log("开始上传")
                };
                xhr.send(form); //开始上传，发送form数据
            });
            d1.show();
        });
    })
    function showlog(message) {
        var d2 = dialog({content: message, ok: function() {}});
        d2.show();
    }
});
