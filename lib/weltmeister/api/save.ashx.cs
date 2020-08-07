using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Script.Serialization;

namespace ImpactJs.lib.weltmeister.api
{
    /// <summary>
    /// Summary description for save
    /// </summary>
    public class save : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {
            var fileRoot = context.Request.MapPath(System.Configuration.ConfigurationManager.AppSettings["fileRoot"]);
            if (!fileRoot.EndsWith("/"))
                fileRoot += "/";

            var path = context.Request.Form["path"];
            var data = context.Request.Form["data"];

            var result = new Result();

            if (!string.IsNullOrEmpty(path) &&
                !string.IsNullOrEmpty(data))
            {
                path = fileRoot + path.Replace("..", "").Replace("/", "\\");

                if (path.EndsWith(".js"))
                {
                    try
                    {
                        //if the file already exists, delete it
                        if (File.Exists(path))
                        {
                            File.Delete(path);
                        }
                        var streamWriter = File.CreateText(path);
                        streamWriter.Write(data);
                        streamWriter.Flush();
                        streamWriter.Close();
                    }
                    catch (Exception ex)
                    {
                        result.error = "2";
                        result.msg = string.Format("Couldn't write to file: {0}", path);
                    }
                }
                else
                {
                    result.error = "3";
                    result.msg = "File must have a .js suffix";
                }

            }
            else
            {
                result.error = "1";
                result.msg = "No Data or Path specified";
            }
            context.Response.ContentType = "application/json";
            context.Response.ContentEncoding = Encoding.UTF8;
            var jserializer = new JavaScriptSerializer();
            context.Response.Write(jserializer.Serialize(result));


        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }

        public class Result
        {
            public string error { get; set; }
            public string msg { get; set; }
        }
    }
}