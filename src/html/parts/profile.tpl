<div data-ui="profile">
	<div class="modal-header">
		<button type="button" class="close" data-dismiss="modal" aria-label="<%= htmlWebpackPlugin.options.i18n['Close'] %>">
			<span aria-hidden="true">&times;</span>
			<span class="sr-only"><%= htmlWebpackPlugin.options.i18n['Close'] %></span>
		</button>
		<h4 class="modal-title"><%= htmlWebpackPlugin.options.i18n['Edit your profile'] %></h4>
	</div>
	<div class="modal-body">
		<h4><%= htmlWebpackPlugin.options.i18n['Edit your profile information below:'] %></h4>
		<form>
			<fieldset class="form-group">
				<div class="input-group">
					<div class="input-group-addon"><i class="fa fa-user"></i></div>
					<input type="text" class="form-control" name="username" readonly
						   placeholder="<%= htmlWebpackPlugin.options.i18n['ID / Nickname'] %>" />
				</div>
			</fieldset>
			<fieldset class="form-group">
				<div class="input-group">
					<div class="input-group-addon"><i class="fa fa-at"></i></div>
					<input type="email" class="form-control" name="email"
						   placeholder="<%= htmlWebpackPlugin.options.i18n['Email'] %>" />
				</div>
				<small class="text-muted"><%= htmlWebpackPlugin.options.i18n['We\'ll never share your email with anyone else.'] %></small>
			</fieldset>


			<fieldset class="form-group">
				<label for="password"><%= htmlWebpackPlugin.options.i18n['Enter a new password if you want to change it'] %></label>
				<div class="input-group">
					<div class="input-group-addon"><i class="fa fa-key"></i></div>
					<input id="password" type="password" class="form-control" name="pass"
						   placeholder="<%= htmlWebpackPlugin.options.i18n['Password'] %>" />
				</div>
			</fieldset>
			<fieldset class="form-group">
				<div class="input-group">
					<div class="input-group-addon"><i class="fa fa-key"></i></div>
					<input type="password" class="form-control" name="passConfirm"
						   placeholder="<%= htmlWebpackPlugin.options.i18n['Confirm password'] %>" />
				</div>
			</fieldset>

			<fieldset class="form-group">
				<label for="language"><%= htmlWebpackPlugin.options.i18n['Language'] %></label>
				<div class="input-group">
					<div class="input-group-addon"><i class="fa fa-globe"></i></div>
					<select id="language" name="language" class="form-control">
						<option value="fr_FR"><%= htmlWebpackPlugin.options.i18n['French'] %></option>
						<option value="en_US"><%= htmlWebpackPlugin.options.i18n['English'] %></option>
					</select>
				</div>
			</fieldset>

			<h4><%= htmlWebpackPlugin.options.i18n['Personal data'] %></h4>
			<p><%= htmlWebpackPlugin.options.i18n['Personal_data_details'] %></p>

			<fieldset class="form-group">
				<label for="displayname"><%= htmlWebpackPlugin.options.i18n['Displayname'] %></label>
				<div class="input-group">
					<div class="input-group-addon"><i class="fa fa-user"></i></div>
					<input type="text" class="form-control" name="displayname" id="displayname"
						   placeholder="<%= htmlWebpackPlugin.options.i18n['Displayname example'] %>" />
				</div>
			</fieldset>

			<fieldset class="form-group">
				<label for="description"><%= htmlWebpackPlugin.options.i18n['Description'] %></label>
				<textarea class="form-control" rows="5" name="description" id="description" placeholder="<%= htmlWebpackPlugin.options.i18n['Describe yourself briefly (300 char. max)'] %>"></textarea>
				<div class="text-xs-right"><small class="text-muted remaining"></small></div>
			</fieldset>

			<fieldset class="form-group">
				<div class="input-group">
					<div class="input-group-addon"><i class="fa fa-briefcase"></i></div>
					<select name="type" id="type" class="form-control">
						<option value=""><%= htmlWebpackPlugin.options.i18n['Choose who you are'] %></option>
						<option value="individual"><%= htmlWebpackPlugin.options.i18n['Individual'] %></option>
						<option value="company"><%= htmlWebpackPlugin.options.i18n['Company'] %></option>
						<option value="organization"><%= htmlWebpackPlugin.options.i18n['Organization'] %></option>
						<option value="other"><%= htmlWebpackPlugin.options.i18n['Other'] %></option>
					</select>
				</div>
			</fieldset>

			<fieldset class="form-group">
				<label for="more-infos"><%= htmlWebpackPlugin.options.i18n['More info link'] %></label>
				<div class="input-group">
					<div class="input-group-addon"><i class="fa fa-link"></i></div>
					<input type="text" class="form-control" placeholder="http://..." id="more-infos" name="url" />
				</div>
			</fieldset>
			<fieldset class="form-group">
				<label for="gender"><%= htmlWebpackPlugin.options.i18n['Gender'] %></label>
				<div class="input-group">
					<div class="input-group-addon"><i class="fa fa-venus-mars"></i></div>
					<select name="gender" id="gender" class="form-control">
						<option value=""><%= htmlWebpackPlugin.options.i18n['Choose your gender'] %></option>
						<option value="male"><%= htmlWebpackPlugin.options.i18n['Male'] %></option>
						<option value="female"><%= htmlWebpackPlugin.options.i18n['Female'] %></option>
					</select>
				</div>
			</fieldset>
			<fieldset class="form-group">
				<label for="birthdate"><%= htmlWebpackPlugin.options.i18n['Birthdate'] %></label>
				<div class="input-group">
					<div class="input-group-addon"><i class="fa fa-birthday-cake"></i></div>
					<input  type="text" data-field="date" class="form-control" name="birthdate" id="birthdate"
						   placeholder="<%= htmlWebpackPlugin.options.i18n['Birthdate'] %>" />
				</div>
			</fieldset>

			<p class="text-xs-right">
				<button type="button" class="pull-left profile-delete btn btn-danger"><i class="fa fa-trash"></i> <%= htmlWebpackPlugin.options.i18n['Delete your profile'] %></button>
				<button type="submit" class="btn btn-primary"><i class="fa fa-check"></i> <%= htmlWebpackPlugin.options.i18n['Save your profile'] %></button>
			</p>
		</form>
	</div>
	<div class="modal-footer">
		<button type="button" class="btn btn-secondary" data-dismiss="modal"><%= htmlWebpackPlugin.options.i18n['Cancel'] %></button>
	</div>
</div>