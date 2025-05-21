namespace ALP.WebAPI.Models.ViewModels
{
    public abstract class ResponseBaseViewModel<TModel>
    {
        public ResponseBaseViewModel(TModel dataObject)
        {
            DataObject = dataObject;
        }
        protected TModel DataObject { get; }
    }
}
